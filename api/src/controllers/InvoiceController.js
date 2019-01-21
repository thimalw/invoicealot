const { makeRes, to, filterSqlErrors, resErrors } = require('../utils/helpers');
const logger = require('../utils/logger');
const { hasPermission } = require('./UserController');
const Invoice = require('../../db').model('invoice');
const InvoiceItems = require('../../db').model('invoiceItems');

const create = async (userId, invoice) => {
  const generalError = 'Unable to create new invoice.';
  
  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, invoice.organizationId, 'invoice');
  
  if (err) {
    logger.error(err);
    return makeRes(500, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to create invoices this organization.']));
  }
  
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

module.exports = {
  create
};
