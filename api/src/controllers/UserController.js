const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { makeRes, to, filterSqlErrors, resErrors } = require('../utils/helpers');
const logger = require('../utils/logger');
const User = require('../../db').model('user');
const OrganizationUsers = require('../../db').model('organizationUsers');
const OrganizationUserPermissions = require('../../db').model('organizationUserPermissions');

const create = async (user) => {
  var errorMessages = [];

  if (!'password' in user && !'passwordConfirmation' in user) {
    errorMessages.push('Password and password confirmation are required.');
  } else if (user.password !== user.passwordConfirmation) {
    errorMessages.push('Password confirmation doesn\'t match.');
  }

  if (errorMessages.length) {
    return makeRes(400, 'Unable to register new user.', resErrors(errorMessages));
  } else {
    let err, savedUser;
    [err, savedUser] = await to(User.create(user), {
      fields: ['firstName', 'lastName', 'email', 'password']
    });

    if (err) {
      logger.error(err);
      const fieldErrors = filterSqlErrors(err);
      return makeRes(400, 'Unable to register new user.', fieldErrors);
    }

    return makeRes(200, 'User registered.', {
      user: {
        id: savedUser.id,
        email: savedUser.email
      }
    });
  }
};

const update = async (userId, user) => {
  let err, updatedUser;
  [err, updatedUser] = await to(User.update(user, {
    where: {
      id: userId
    },
    fields: [
      'firstName',
      'lastName'
    ]
  }));

  if (err) {
    logger.error(err);
    console.log(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(400, 'Unable to update user details.', fieldErrors);
  }

  return makeRes(200, 'Successfully updated user details.');
};

const updatePassword = async (userId, user) => {
  var errorMessages = [];

  if (!'password' in user && !'passwordConfirmation' in user && !'currentPassword' in user) {
    errorMessages.push('All fields are required.');
  } else if (user.password !== user.passwordConfirmation) {
    errorMessages.push('Password confirmation doesn\'t match.');
  }

  if (errorMessages.length) {
    return makeRes(400, 'Unable to update the password.', resErrors(errorMessages));
  } else {
    let err, userInfo;
    [err, userInfo] = await to(User.findByPk(userId));

    if (err) {
      logger.error(err);
      const fieldErrors = filterSqlErrors(err);
      return makeRes(400, 'Unable to update the password.', fieldErrors);
    }

    if (!userInfo) {
      return makeRes(401, 'Unable to authenticate.');
    }

    if (!bcrypt.compareSync(user.currentPassword, userInfo.password)) {
      return makeRes(400, 'Unable to update the password.', resErrors(['Incorrect existing password.']));
    }

    let updatedUser;
    [err, updatedUser] = await to(User.update(user, {
      where: {
        id: userId
      },
      fields: [
        'password'
      ]
    }));

    if (err) {
      logger.error(err);
      const fieldErrors = filterSqlErrors(err);
      return makeRes(400, 'Unable to update  the password.', fieldErrors);
    }

    return makeRes(200, 'Successfully updated the password');
  }
};

const authenticate = async ({ email, password }) => {
  let err, userInfo;
  [err, userInfo] = await to(User.findOne({ where: { email }}));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(401, 'Unable to authenticate.', fieldErrors);
  }

  if (userInfo && bcrypt.compareSync(password, userInfo.password)) {
    const secret = process.env.JWT_SECRET;
    const opts = {
      expiresIn: parseInt(process.env.JWT_EXPIRE)
    };

    const token = jwt.sign({ id: userInfo.id }, secret, opts);

    return makeRes(200, 'Authentication successful.', { token });
  }

  return makeRes(401, 'Unable to authenticate.', resErrors(['Invalid credentials.']));
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
  update,
  updatePassword,
  authenticate,
  hasPermission
};
