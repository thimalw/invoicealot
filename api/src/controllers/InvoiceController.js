const { makeRes, to, filterSqlErrors, resErrors } = require('../utils/helpers');
const logger = require('../utils/logger');
const { hasPermission } = require('./UserController');
const db = require('../../db');
const Invoice = require('../../db').model('invoice');
const InvoiceItem = require('../../db').model('invoiceItem');
const Organization = require('../../db').model('organization');

const create = async (userId, organizationId, invoice) => {
  const generalError = 'Unable to create new invoice.';
  
  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'invoice');
  
  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to create invoices in this organization.']));
  }

  invoice.organizationId = organizationId;
  
  let savedInvoice;
  [err, savedInvoice] = await to(Invoice.create(invoice), {
    fields: [
      'organizationId',
      'number',
      'type',
      'dueDate',
      'notes',
      'footer',
      'state'
    ]
  });

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(401, generalError, fieldErrors);
  }

  return makeRes(200, 'Invoice created successfully.', {
    invoice: {
      id: savedInvoice.id
    }
  });
};

const list = async (userId, organizationId, type) => {
  const generalError = 'Unable to retrieve invoices.';

  type = typeof type !== 'undefined' ? type : 'invoice';

  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'invoice');

  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to view invoices in this organization.']));
  }
  
  let invoices;
  [err, invoices] = await to(Invoice.findAll({
    include: [
      {
        model: InvoiceItem,
        as: 'invoiceItems',
        attributes: []
      },
      {
        model: Organization,
        where: {
          id: organizationId
        },
        attributes: []
      }
    ],
    where: {
      type: type
    },
    attributes: [
      'id',
      'number',
      [db.fn('sum', db.col('invoiceItems.price')), 'total'],
      'dueDate',
      'status',
      'createdAt'
    ],
    group: ['invoice.id', 'invoiceItems.invoiceId'],
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, 'Unable to retrieve invoices.', fieldErrors);
  }

  return makeRes(200, 'Invoices retrieved.', { invoices });
};

const get = async (userId, organizationId, invoiceId, type) => {
  const generalError = 'Unable to retrieve invoice details.';

  type = typeof type !== 'undefined' ? type : 'invoice';

  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'invoice');

  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to view invoices in this organization.']));
  }

  let invoice;
  [err, invoice] = await to(Invoice.findByPk(invoiceId, {
    include: [
      {
        model: InvoiceItem,
        as: 'invoiceItems',
        attributes: []
      },
      {
        model: Organization,
        where: {
          id: organizationId
        },
        attributes: []
      }
    ],
    where: {
      type: type
    },
    attributes: [
      'id',
      'number',
      'type',
      [db.fn('sum', db.col('invoiceItems.price')), 'total'],
      'dueDate',
      'notes',
      'footer',
      'status',
      'createdAt',
      'updatedAt'
    ],
    group: ['invoice.id', 'invoiceItems.invoiceId'],
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, generalError, fieldErrors);
  }

  let invoiceItems;
  [err, invoiceItems] = await to(InvoiceItem.findAll({
    where: {
      invoiceId: invoiceId
    },
    attributes: [
      'id',
      'name',
      'quantity',
      'price'
    ]
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, generalError, fieldErrors);
  }

  return makeRes(200, 'Invoice details retrieved.', { invoice, invoiceItems });
};

module.exports = {
  create,
  list,
  get
};
