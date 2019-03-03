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

const destroy = async (userId, organizationId, invoiceId) => {
  const generalError = 'Unable to delete invoice.';

  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'invoice');

  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to access invoices in this organization.']));
  }

  let destroyedInvoice;
  [err, destroyedInvoice] = await to(Invoice.destroy({
    where: {
      id: invoiceId,
      organizationId: organizationId
    }
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, generalError, fieldErrors);
  }

  return makeRes(200, 'Invoice deleted.');
};

const update = async (userId, organizationId, invoiceId, invoice) => {
  const generalError = 'Unable to update invoice.';

  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'invoice');

  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to access invoices in this organization.']));
  }

  let updatedInvoice;
  [err, updatedInvoice] = await to(Invoice.update(invoice, {
    where: {
      id: invoiceId,
      organizationId: organizationId
    },
    fields: [
      'number',
      'type',
      'dueDate',
      'notes',
      'footer',
      'status'
    ]
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, generalError, fieldErrors);
  }

  return makeRes(200, 'Invoice updated.');
};

const createInvoiceItem = async (userId, organizationId, invoiceId, invoiceItem) => {
  const generalError = 'Unable to add invoice item.';

  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'invoice');

  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to access invoices in this organization.']));
  }

  let invoice;
  [err, invoice] = await to(Invoice.findOne({
    where: {
      id: invoiceId,
      organizationId: organizationId
    }
  }));

  if (err) {
    logger.error(err);
    return makeRes(500, generalError);
  }

  if (!invoice) {
    return makeRes(401, generalError, resErrors(['Invoice not found.']));
  }

  let savedInvoiceItem;
  [err, savedInvoiceItem] = await to(db.transaction(t => {
    return InvoiceItem.create(invoiceItem, {
      fields: [
        'name',
        'quantity',
        'price'
      ],
      transaction: t
    }).then(async newInvoiceItem => {
      const addedInvoiceItem = invoice.addInvoiceItem(newInvoiceItem);
      return {
        id: newInvoiceItem.dataValues.id
      };
    });
  }));

  if (err) {
    logger.error(err);
    console.log(err);
    return makeRes(500, generalError);
  }

  return makeRes(200, 'Added invoice item.', {
    invoiceItem: {
      id: savedInvoiceItem.id
    }
  });
};

const updateInvoiceItem = async (userId, organizationId, invoiceId, invoiceItemId, invoiceItem) => {
  const generalError = 'Unable to update invoice item.';

  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'invoice');

  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to access invoices in this organization.']));
  }

  let invoice;
  [err, invoice] = await to(Invoice.findOne({
    where: {
      id: invoiceId,
      organizationId: organizationId
    }
  }));

  if (err) {
    logger.error(err);
    return makeRes(500, generalError);
  }

  if (!invoice) {
    return makeRes(401, generalError, resErrors(['Invoice not found.']));
  }

  let updatedInvoiceItem;
  [err, updatedInvoiceItem] = await to(InvoiceItem.update(invoiceItem, {
    where: {
      id: invoiceItemId,
      invoiceId: invoiceId
    },
    fields: [
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

  return makeRes(200, 'Invoice item updated.');
};

const destroyInvoiceItem = async (userId, organizationId, invoiceId, invoiceItemId) => {
  const generalError = 'Unable to delete invoice item.';

  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'invoice');

  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to access invoices in this organization.']));
  }

  let invoice;
  [err, invoice] = await to(Invoice.findOne({
    where: {
      id: invoiceId,
      organizationId: organizationId
    }
  }));

  if (err) {
    logger.error(err);
    return makeRes(500, generalError);
  }

  if (!invoice) {
    return makeRes(401, generalError, resErrors(['Invoice not found.']));
  }

  let destroyedInvoiceItem;
  [err, destroyedInvoiceItem] = await to(InvoiceItem.destroy({
    where: {
      id: invoiceItemId,
      invoiceId: invoiceId
    }
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, generalError, fieldErrors);
  }

  return makeRes(200, 'Invoice item deleted.');
};

module.exports = {
  create,
  list,
  get,
  destroy,
  update,
  createInvoiceItem,
  updateInvoiceItem,
  destroyInvoiceItem
};
