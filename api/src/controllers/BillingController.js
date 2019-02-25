const crypto = require('crypto');
const { makeRes, to, filterSqlErrors, resErrors } = require('../utils/helpers');
const logger = require('../utils/logger');
const db = require('../../db');
const User = require('../../db').model('user');
const UserCard = require('../../db').model('userCard');
const UserTransaction = require('../../db').model('userTransaction');
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

const payherePreapprove = async (preapproval) => {
  const payhereSecretHash = crypto.createHash('md5').update(process.env.PAYHERE_SECRET).digest("hex").toUpperCase();
  const requestHashPre = process.env.PAYHERE_ID + preapproval.order_id + preapproval.payhere_amount + preapproval.payhere_currency + preapproval.status_code + payhereSecretHash;
  const requestHash = crypto.createHash('md5').update(requestHashPre).digest("hex").toUpperCase();
  const cardNo = preapproval.card_no; // TODO trim card no

  if (requestHash !== preapproval.md5sig) {
    return makeRes(401, 'Unauthorized');
  }

  if (preapproval.status_code != 2) {
    return makeRes(400, 'Bad request');
  }

  let err, user;
  [err, user] = await to(User.findByPk(preapproval.order_id));

  if (err) {
    logger.error(err);
    console.log('error1');
    return makeRes(500, 'Error', fieldErrors);
  }

  if (!user) {
    return makeRes(400, 'Bad request');
  }

  let existingCard;
  [err, existingCard] = await to(UserCard.findOne({
    where: {
      token: preapproval.customer_token
    }
  }));

  if (err) {
    logger.error(err);
    return makeRes(500, 'Error');
  }

  if (existingCard) {
    return makeRes(200, 'Card exists');
  }

  if (preapproval.payment_id && preapproval.payhere_amount) {
    let processedTransaction;
    [err, processedTransaction] = await to(UserTransaction.findOne({
      where: {
        type: 'payhere',
        paymentId: preapproval.payment_id
      }
    }));

    if (err) {
      logger.error(err);
      return makeRes(500, 'Error');
    }

    if (!processedTransaction) {
      let addedCredits;
      [err, addedCredits] = await to(addCredits(user.id, preapproval.payhere_amount));

      if (err) {
        logger.error(err);
        console.log('error2');
        return makeRes(500, 'Error');
      }

      await to(addTransaction(user.id, preapproval.payhere_amount, `Added credits from card ending ${cardNo}`, 'payhere', preapproval.payment_id));
    }
  }

  const card = {
    name: preapproval.card_holder_name,
    number: cardNo,
    token: preapproval.customer_token
  };

  let cardAdded;
  [err, cardAdded] = await to(addCard(user.id, card));

  if (err) {
    logger.error(err);
    console.log(err);
    console.log('error3');
    return makeRes(500, 'Error');
  }

  if (cardAdded) {
    return makeRes(200, 'Success');
  }

  console.log('error4');
  return makeRes(500, 'Error');
};

const addCard = async (userId, card) => {
  let err, user;
  [err, user] = await to(User.findByPk(userId));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (!user) {
    return false;
  }

  let cardInstance;
  [err, cardInstance] = await to(UserCard.create(card));

  if (err) {
    logger.error(err);
    throw err;
  }

  let savedCard;
  [err, savedCard] = await to(user.addUserCard(cardInstance));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (savedCard) {
    return true;
  }

  return false;
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
      await to(addTransaction(userId, cardCharged.data.data.amount, `Added credits from card ending ${card.number}`, 'payhere', cardCharged.data.data.payment_id));
      await to(addCredits(userId, cardCharged.data.data.amount));

      break;
    }
  }

  return charged;
};

const addTransaction = async (userId, amount, description, type, paymentId) => {
  description = typeof description === 'undefined' ? null : description;
  type = typeof type === 'undefined' ? null : type;
  paymentId = typeof paymentId === 'undefined' ? null : paymentId;

  let err, user;
  [err, user] = await to(User.findByPk(userId));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (!user) {
    return false;
  }

  let savedTransaction;
  [err, savedTransaction] = await to(UserTransaction.create({
    amount,
    description,
    type,
    paymentId
  }));

  if (err) {
    logger.error(err);
    throw err;
  }

  let savedUserTransaction;
  [err, savedUserTransaction] = await to(user.addTransaction(savedTransaction));

  if (err) {
    logger.error(err);
    throw err;
  }

  return true;
};

module.exports = {
  pay,
  getCredits,
  addCredits,
  payherePreapprove,
  addTransaction
};
