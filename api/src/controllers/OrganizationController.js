const db = require('../../db');
const logger = require('../utils/logger');
const { makeRes, to, filterSqlErrors, resErrors } = require('../utils/helpers');
const { hasPermission, isVerified } = require('./UserController');
const Organization = require('../../db').model('organization');
const OrganizationPlan = require('../../db').model('organizationPlan');
const OrganizationUserPermission = require('../../db').model('organizationUserPermission');
const User = require('../../db').model('user');
const OrganizationUser = require('../../db').model('organizationUser');
const UserInvoiceController = require('./UserInvoiceController');

const create = async (userId, organization) => {
  let err, user;
  [err, user] = await to(User.findByPk(userId));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, 'Unable to create new organization.', fieldErrors);
  } else if (!user) {
    return makeRes(400, 'Unable to create new organization.', resErrors(['Invalid user.']));
  }

  let userVerified;
  [err, userVerified] = await to(isVerified(userId));
  
  if (err) {
    logger.error(err);
    return makeRes(500, 'Unable to create new organization.');
  }

  if (!userVerified) {
    return makeRes(400, 'Unable to create new organization.', resErrors(['Please verify your email address before creating an organization.']));
  }

  organization.paymentDue = Date.now();
  
  let savedOrganization;
  [err, savedOrganization] = await to(db.transaction(t => {
    return Organization.create(organization, {
      fields: ['name', 'organizationPlanId', 'paymentDue'],
      transaction: t
    }).then(async newOrganization => {
      const savedOrgUser = await user.addOrganization(newOrganization, {
        through: {
          role: 'owner'
        },
        transaction: t
      });

      return {
        ...newOrganization,
        organizationUser: savedOrgUser
      };
    });
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, 'Unable to create new organization.', fieldErrors);
  }

  let userInvoice;
  [err, userInvoice] = await to(UserInvoiceController.create(savedOrganization.dataValues.id, true, false));
  
  return makeRes(200, 'Organization created successfully.', {
    organization: {
      id: savedOrganization.dataValues.id,
      paid: userInvoice.paid
    }
  });
};

const list = async (userId) => {
  let err, organizations;
  [err, organizations] = await to(Organization.findAll({
    include: [{
      model: User,
      where: {
        id: userId
      },
      attributes: []
    }],
    attributes: [
      'id',
      'name',
      'logo'
    ]
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, 'Unable to retrieve organizations.', fieldErrors);
  }

  return makeRes(200, 'Organizations retrieved.', { organizations });
};

const get = async (userId, organizationId) => {
  let err, organization;
  [err, organization] = await to(Organization.findByPk(organizationId, {
    include: [
      {
        model: User,
        where: {
          id: userId
        },
        attributes: ['id'],
        through: {
          attributes: ['role'],
        }
      }
    ],
    attributes: [
      'id',
      'name',
      'logo'
    ]
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, 'Unable to retrieve organization details.', fieldErrors);
  }

  if (!organization) {
    return makeRes(404, 'Organization not found.');
  }

  return makeRes(200, 'Organization details retrieved.', { organization });
};

const addUser = async (userId, organizationId, organizationUser) => {
  const generalError = 'Unable to add user to the organization.';
  
  let err, hasPermissionRes;
  [err, hasPermissionRes] = await hasPermission(userId, organizationId, 'organization.user');
  if (err) {
    logger.error(err);
    return makeRes(400, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!hasPermissionRes) {
    return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to add new users to this organization.']));
  }

  if (organizationUser.role === 'owner') {
    let isOrganizationOwned;
    [err, isOrganizationOwned] = isOrganizationOwned(userId, organizationId);
    if (err) {
      logger.error(err);
      return makeRes(400, generalError, resErrors(['Please try again. If the error continues, contact support.']));
    } else if (!isOrganizationOwned) {
      return makeRes(403, generalError, resErrors(['Sorry, you don\'t have permission to add an owner to this organization.']));
    }
  }
  
  let organization;
  [err, organization] = await to(Organization.findByPk(organizationId));
  if (err) {
    logger.error(err);
    return makeRes(400, generalError, resErrors(['Please try again. If the errolikr continues, contact support.']));
  } else if (!organization) {
    return makeRes(404, generalError, resErrors(['Organization not found.']));
  }

  let user;
  [err, user] = await to(User.findByPk(organizationUser.userId));
  if (err) {
    logger.error(err);
    return makeRes(400, generalError, resErrors(['Please try again. If the error continues, contact support.']));
  } else if (!user) {
    return makeRes(404, generalError, resErrors(['User not found.']));
  }

  let savedOrgUser;
  [err, savedOrgUser] = await to(organization.addUser(user, { through: { role: organizationUser.role }}));
  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, generalError, fieldErrors);
  }

  // insert custom permissions if user is not an owner
  if (organizationUser.role !== 'owner' && Array.isArray(organizationUser.permissions) && organizationUser.permissions.length) {
    var permissionErr = false;

    let deletedRows;
    // TODO: fix hard coded array access. might throw errors
    [err, deletedRows] = await to(OrganizationUserPermission.destroy({ where: { organizationUserId: savedOrgUser[0][0].id }}));
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
      [err, savedPermission] = await to(OrganizationUserPermission.create({ organizationUserId: savedOrgUser[0][0].id, permission }));
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
  [err, result] = await to(OrganizationUser.findOne({ where: { organizationId, userId, role: 'owner' }}));

  return err, result;
}

const listPlans = async (userId) => {
  let err, organizationPlans;
  [err, organizationPlans] = await to(OrganizationPlan.findAll({
    where: {
      active: 1,
      stock: {
        [db.Op.or]: {
          [db.Op.eq]: -1,
          [db.Op.gt]: 0
        }
      }
    },
    attributes: [
      'id',
      'name',
      'price',
      'cycle'
    ]
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, 'Unable to retrieve organization plans.', fieldErrors);
  }

  return makeRes(200, 'Organization plans retrieved.', { organizationPlans });
};

module.exports = {
  create,
  list,
  get,
  addUser,
  isOrganizationOwned,
  listPlans
};
