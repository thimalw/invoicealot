const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { makeRes, to, filterSqlErrors } = require('../utils/helpers');
const User = require('../../db').model('user');
const OrganizationUsers = require('../../db').model('organizationUsers');
const OrganizationUserPermissions = require('../../db').model('organizationUserPermissions');

const create = async (user) => {
  let err, savedUser;
  [err, savedUser] = await to(User.create(user), {
    fields: ['firstName', 'lastName', 'email', 'password']
  });

  if (err) {
    // logger.error(err); TODO: add logger
    const errorMessages = filterSqlErrors(err);
    return makeRes(401, 'Unable to register new user.', errorMessages);
  }

  return makeRes(200, 'User registered.', {
    user: {
      id: savedUser.id,
      email: savedUser.email
    }
  });
};

const authenticate = async ({ email, password }) => {
  let err, userInfo;
  [err, userInfo] = await to(User.findOne({ where: { email }}));

  if (err) {
    // logger.error(err); TODO: add logger
    const errorMessages = filterSqlErrors(err);
    return makeRes(401, 'Unable to authenticate.', errorMessages);
  }

  if (userInfo && bcrypt.compareSync(password, userInfo.password)) {
    const secret = 'SECRET_KEY'; // TODO
    const opts = {
      expiresIn: 86400 // 24 hours // TODO: use env var
    };

    const token = jwt.sign({ id: userInfo.id }, secret, opts);

    return makeRes(200, 'Authentication successful.', { token });
  }

  return makeRes(401, 'Unable to authenticate.', ['Invalid credentials.']);
};

const hasPermission = async (userId, organizationId, permission) => {
  let err, organizationUser;
  [err, organizationUser] = await to(OrganizationUsers.findOne({ where: { userId, organizationId }}));
  
  if (err || !organizationUser) {
    return [err, false];
  } else if (organizationUser.role === 'owner') {
    return [null, true];
  } else {
    [err, orgUserPermissions] = await to(OrganizationUserPermissions.findOne({ where: { organizationUserId: organizationUser.id, permission }}));
    if (err || !orgUserPermissions) {
      return [err, false];
    } else {
      return [null, true];
    }
  }
};

module.exports = {
  create,
  authenticate,
  hasPermission
};
