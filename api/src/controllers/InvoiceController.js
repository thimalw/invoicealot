const { makeRes, to, filterSqlErrors } = require('../utils/helpers');
const { isOrganizationOwned } = require('./OrganizationController');
const Invoice = require('../../db').model('invoice');

const create = async (userId, invoice) => {
  let err, organizationOwned;
  [err, organizationOwned] = await to(isOrganizationOwned(userId, invoice.organizationId));

  if (err) {
    // logger.error(err); TODO: add logger
    return makeRes(500, 'Unable to create new invoice.', ['Unable to create new invoice.']);
  }

  if (!organizationOwned) {
    return makeRes(404, 'Unable to create new invoice.', ['Organization not found']);
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
    // logger.error(err); TODO: add logger
    const errorMessages = filterSqlErrors(err);
    return makeRes(401, 'Unable to create new invoice.', errorMessages);
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
