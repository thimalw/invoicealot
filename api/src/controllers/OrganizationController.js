const { makeRes, to, filterSqlErrors, resErrors } = require('../utils/helpers');
const logger = require('../utils/logger');
const Organization = require('../../db').model('organization');
const User = require('../../db').model('user');
const OrganizationUsers = require('../../db').model('organizationUsers');
const OrganizationUserPermissions = require('../../db').model('organizationUserPermissions');
const { hasPermission } = require('./UserController');

const create = async (userId, organization) => {
  let err, user;
  [err, user] = await to(User.findByPk(userId));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(401, 'Unable to create new organization.', fieldErrors);
  } else if (!user) {
    return makeRes(400, 'Unable to create new organization.', resErrors(['Invalid user.']));
  }
  
  let savedOrganization;
  [err, savedOrganization] = await to(Organization.create(organization));
  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(401, 'Unable to create new organization.', fieldErrors);
  }
  
  [err, savedOrgUser] = await to(user.addOrganization(savedOrganization, { through: { role: 'owner' }}));
  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(401, 'Unable to create new organization.', fieldErrors);
  }

  return makeRes(200, 'Organization created successfully.', {
    organization: {
      id: savedOrganization.id
    }
  });
};

const addUser = async (userId, organizationId, organizationUser) => {
  const generalError = 'Unable to add user to the organization.';
  
  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'organization.user');
  if (err) {
    logger.error(err);
    return makeRes(401, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to add new users to this organization.']));
  }

  if (organizationUser.role === 'owner') {
    let isOrganizationOwned;
    [err, isOrganizationOwned] = isOrganizationOwned(userId, organizationId);
    if (err) {
      logger.error(err);
      return makeRes(401, generalError, resErrors(['Please try again. If the error continues, contact support.']));
    } else if (!isOrganizationOwned) {
      return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to add an owner to this organization.']));
    }
  }
  
  let organization;
  [err, organization] = await to(Organization.findByPk(organizationId));
  if (err) {
    logger.error(err);
    return makeRes(401, generalError, resErrors(['Please try again. If the errolikr continues, contact support.']));
  } else if (!organization) {
    return makeRes(404, generalError, resErrors(['Organization not found.']));
  }

  let user;
  [err, user] = await to(User.findByPk(organizationUser.userId));
  if (err) {
    logger.error(err);
    return makeRes(401, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!user) {
    return makeRes(404, generalError, resErrors(['User not found.']));
  }

  let savedOrgUser;
  [err, savedOrgUser] = await to(organization.addUser(user, { through: { role: organizationUser.role }}));
  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(401, generalError, fieldErrors);
  }

  // insert custom permissions if user is not an owner
  if (organizationUser.role !== 'owner' && Array.isArray(organizationUser.permissions) && organizationUser.permissions.length) {
    var permissionErr = false;

    let deletedRows;
    // TODO: fix hard coded array access. might throw errors
    [err, deletedRows] = await to(OrganizationUserPermissions.destroy({ where: { organizationUserId: savedOrgUser[0][0].id }}));
    if (err) {
      return makeRes(200, 'Added user to the organization. But errors occured while saving user permissions.', {
        organizationUser: {
          userId: user.id,
          organizationId: organization.id
        }
      });
    }

    var savedPermission;
    for (permission of organizationUser.permissions) {
      // TODO: fix hard coded array access. might throw errors
      [err, savedPermission] = await to(OrganizationUserPermissions.create({ organizationUserId: savedOrgUser[0][0].id, permission }));
      if (err) {
        permissionErr = true;
      }
    }

    if (permissionErr) {
      return makeRes(200, 'Added user to the organization. But errors occured while saving user permissions.', {
        organizationUser: {
          userId: user.id,
          organizationId: organization.id
        }
      });
    }
  }

  return makeRes(200, 'Successfully added user to the organization', {
    organizationUser: {
      userId: user.id,
      organizationId: organization.id
    }
  });
};

const isOrganizationOwned = async (userId, organizationId) => {
  let err, result;
  [err, result] = await to(OrganizationUsers.findOne({ where: { organizationId, userId, role: 'owner' }}));

  return err, result;
}

module.exports = {
  create,
  addUser,
  isOrganizationOwned
};
