const { makeRes, to, filterSqlErrors } = require('../utils/helpers');
const Organization = require('../../db').model('organization');
const User = require('../../db').model('user');
const OrganizationUsers = require('../../db').model('organizationUsers');

const create = async (userId, organization) => {
  let err, user;
  [err, user] = await to(User.findByPk(userId));

  if (err) {
    // logger.error(err); TODO: add logger
    const errorMessages = filterSqlErrors(err);
    return makeRes(401, 'Unable to create new organization.', errorMessages);
  } else if (!user) {
    return makeRes(401, 'Unable to create new organization.', ['Invalid user.']);
  }
  
  let savedOrganization;
  [err, savedOrganization] = await to(Organization.create(organization), {
    fields: ['name']
  });

  if (err) {
    // logger.error(err); TODO: add logger
    const errorMessages = filterSqlErrors(err);
    return makeRes(401, 'Unable to create new organization.', errorMessages);
  }
  
  [err, organizationUser] = await to(user.addOrganization(savedOrganization, { through: { role: 'owner' }}));

  if (err) {
    // logger.error(err); TODO: add logger
    console.log(err);
    const errorMessages = filterSqlErrors(err);
    return makeRes(401, 'Unable to create new organization.', errorMessages);
  }

  return makeRes(200, 'Organization created successfully.', {
    organization: {
      id: savedOrganization.id
    }
  });
};

const isOrganizationOwned = async (userId, organizationId) => {
  let err, result;
  [err, result] = await to(OrganizationUsers.findOne({ where: { organizationId, userId }}));

  return err, result;
}

module.exports = {
  create,
  isOrganizationOwned
};
