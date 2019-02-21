const { to } = require('../utils/helpers');
const logger = require('../utils/logger');
const mailer = require('../utils/mailer');
const db = require('../../db');
const User = require('../../db').model('user');
const UserInvoice = require('../../db').model('userInvoice');
const UserInvoiceItem = require('../../db').model('userInvoiceItem');
const Organization = require('../../db').model('organization');
const OrganizationPlan = require('../../db').model('organizationPlan');
const UserController = require('./UserController');
const BillingController = require('./BillingController');

const create = async (organizationId, charge, notify) => {
  charge = typeof charge !== 'undefined' ? charge : true;
  notify = typeof notify !== 'undefined' ? notify : true;

  let paid = false;

  let err, organization;
  [err, organization] = await to(Organization.findByPk(organizationId, {
    include: [
      {
        model: User,
        attributes: ['id'],
        through: {
          where: {
            role: 'owner'
          }
        }
      },
      {
        model: OrganizationPlan,
        attributes: [
          'id',
          'name',
          'price',
          'cycle'
        ]
      }
    ],
    attributes: [
      'id',
      'name',
    ]
  }));

  if (err) {
    logger.error(err);
    throw err;
  }

  let userInvoice;
  userInvoice = {
    organizationId: organization.id,
    userId: organization.users[0].id,
    dueDate: '2019-02-28'
  };

  if (err) {
    logger.error(err);
    throw err;
  }

  let invoiceItems;
  [err, invoiceItems] = await to(UserInvoiceItem.bulkCreate([{
    name: `Organization #${organization.id} - ${organization.name}`,
    quantity: '1',
    description: `Plan: ${organization.organizationPlan.name}`,
    price: organization.organizationPlan.price
  }]));

  if (err) {
    logger.error(err);
    throw err;
  }

  let savedUserInvoice;
  [err, savedUserInvoice] = await to(db.transaction(t => {
    return UserInvoice.create(userInvoice, {
      transaction: t
    }).then(async newUserInvoice => {
      const savedUserInvoiceItems = newUserInvoice.addUserInvoiceItems(invoiceItems, {
        transaction: t
      });

      return {
        ...newUserInvoice,
        userInvoiceItems: savedUserInvoiceItems
      };
    });
  }));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (charge === true) {
    [err, paid] = await to(pay(savedUserInvoice.dataValues.id));
    paid = typeof paid === 'undefined' ? false : paid;
  }

  return {
    ...savedUserInvoice,
    paid
  };
};

const pay = async (userInvoiceId, notify) => {
  notify = typeof notify !== 'undefined' ? notify : true;
  let paid = false;

  let err, userInvoice;
  [err, userInvoice] = await to(UserInvoice.findByPk(userInvoiceId, {
    attributes: [
      'status',
      'userId',
      'organizationId',
      [db.fn('sum', db.col('userInvoiceItems.price')), 'total']
    ],
    include: [
      {
        model: UserInvoiceItem,
        as: 'userInvoiceItems',
        attributes: []
      },
      {
        model: Organization,
        attributes: ['name']
      }
    ]
  }));

  if (err) {
    logger.error(err);
    throw err;
  }

  if (userInvoice.dataValues.status !== 1) {
    if (userInvoice.dataValues.total > 0) {
      let madePayment;
      [err, madePayment] = await to(BillingController.pay(userInvoice.dataValues.userId, userInvoice.dataValues.total));

      if (err) {
        logger.error(err);
        throw err;
      }

      if (madePayment) {
        paid = true;
      }
    } else {
      // nothing to pay
      paid = true;
    }
  }
  
  if (paid) {
    let savedUserTransaction;
    // [err, savedUserTransaction] = await to(BillingController.addTransaction(userInvoice.dataValues.userId, userInvoice.dataValues.total, `Payment for invoice #${userInvoice.dataValues.id}`));
    
    let updateUserInvoice;
    [err, updateUserInvoice] = await to(UserInvoice.update({ status: 1 }, {
      where: {
        id: userInvoiceId
      },
      fields: ['status']
    }));

    if (err) {
      logger.error(err);
      throw err;
    }

    return true;
  }

  return false;
};

module.exports = {
  create
};
