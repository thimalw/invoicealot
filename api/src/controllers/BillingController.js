const { to } = require('../utils/helpers');
const logger = require('../utils/logger');
const db = require('../../db');
const User = require('../../db').model('user');
const UserCard = require('../../db').model('userCard');
const { payhereApi } = require('../utils/payhere');

const pay = async (userId, amount) => {
  if (amount <= 0) {
    return true;
  }
  
  let err, credits;
  [err, credits] = await to(getCredits(userId));

  if (err) {
    logger.error(err);
    throw err;
  }

  credits = parseFloat(credits);
  amount = parseFloat(amount);

  if (credits < amount) {
    const chargeAmount = amount - credits;

    let cardCharged;
    [err, cardCharged] = await to(chargeCard(userId, chargeAmount));

    if (err) {
      logger.error(err);
      throw err;
    }

    if (cardCharged === false) {
      return false;
    }
  }

  // pay from credits
  let deducted;
  [err, deducted] = await to(addCredits(userId, amount * -1));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (deducted === true) {
    return true;
  }

  return false;
};

const getCredits = async (userId) => {
  let err, user;
  [err, user] = await to(User.findByPk(userId, {
    attributes: ['credits']
  }));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (user && user.credits) {
    return user.credits;
  }

  throw new Error('User not found.');
};

const addCredits = async (userId, amount) => {
  let err, addedCredits;
  [err, addedCredits] = await to(User.update({ credits: db.literal(`users.credits + ${amount}`) }, {
    where: {
      id: userId
    },
    fields: ['credits']
  }));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (addedCredits[0]) {
    return true;
  }

  return false;
};

const getCards = async (userId) => {
  let err, cards;
  [err, cards] = await to(UserCard.findAll({
    where: {
      userId: userId
    }
  }));

  if (err) {
    logger.error(err);
    throw err;
  }

  return cards;
};

const chargeCard = async (userId, amount) => {
  let charged = false;
  
  let err, cards;
  [err, cards] = await to(getCards(userId));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (!cards.length) {
    return false;
  }

  for (card of cards) {
    let cardCharged;
    [err, cardCharged] = await to(payhereApi.post('/payment/charge', {
      order_id: userId,
      items: 'Invoicealot Credits',
      currency: 'USD',
      amount: amount,
      customer_token: card.dataValues.token
    }));

    if (err) {
      logger.error(err);
      throw err;
    }

    if (cardCharged.data.status === 1 && (cardCharged.data.data.status_code === 2 || cardCharged.data.data.status_code === 0) && cardCharged.data.data.currency === 'USD') {
      charged = true;
      await to(addCredits(userId, cardCharged.data.data.amount));

      break;
    }
  }

  return charged;
};

module.exports = {
  pay,
  getCredits,
  addCredits
};
