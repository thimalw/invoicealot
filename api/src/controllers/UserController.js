const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { makeRes, to, filterSqlErrors, resErrors } = require('../utils/helpers');
const logger = require('../utils/logger');
const mailer = require('../utils/mailer');
const db = require('../../db');

const User = require('../../db').model('user');
const UserEmails = require('../../db').model('userEmails');
const UserEmailVerifications = require('../../db').model('userEmailVerifications');
const Organization = require('../../db').model('organization');
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
    const emailToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    let err, savedUser;
    [err, savedUser] = await to(db.transaction(t => {
      return User.create(user, {
        fields: ['firstName', 'lastName', 'password'],
        transaction: t
      }).then(async newUser => {
        const newUserEmail = await UserEmails.create({
          userId: newUser.id,
          email: user.email,
          primary: '1'
        }, {
          transaction: t
        });

        return {
          ...newUser,
          userEmails: newUserEmail
        }
      }).then(async newUser => {
        const newUserEmailVerification = await UserEmailVerifications.create({
          userEmailId: newUser.userEmails.id,
          token: emailToken
        }, {
          transaction: t
        });

        return {
          ...newUser,
          userEmailVerifications: newUserEmailVerification
        }
      });
    }));

    if (err) {
      logger.error(err);
      const fieldErrors = filterSqlErrors(err);
      return makeRes(400, 'Unable to register new user.', fieldErrors);
    }

    let mailSent;
    [err, mailSent] = await to(mailer.mailUser(savedUser.dataValues.id, 'user.create', { emailToken }));

    if (err) {
      console.log(err);
    }

    return makeRes(200, 'User registered.', {
      user: {
        id: savedUser.dataValues.id,
        email: savedUser.userEmails.dataValues.email
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
      return makeRes(400, 'Unable to update the password.', fieldErrors);
    }

    return makeRes(200, 'Successfully updated the password');
  }
};

const authenticate = async ({ email, password }) => {
  let err, userEmail;
  [err, userEmail] = await to(UserEmails.findOne({
    where: {
      email
    },
    include: [{
      model: User
    }]
  }));

  if (err) {
    logger.error(err);
    const fieldErrors = filterSqlErrors(err);
    return makeRes(401, 'Unable to authenticate.', fieldErrors);
  }

  if (userEmail && userEmail.user && bcrypt.compareSync(password, userEmail.user.password)) {
    const secret = process.env.JWT_SECRET;
    const opts = {
      expiresIn: parseInt(process.env.JWT_EXPIRE)
    };
    const token = jwt.sign({ id: userEmail.user.id }, secret, opts);

    let organizations;
    [err, organizations] = await to(Organization.findAll({
      include: [{
        model: User,
        where: {
          id: userEmail.user.id
        },
        attributes: []
      }],
      attributes: [
        'id',
        'name'
      ]
    }));

    if (err) {
      logger.error(err);
      const fieldErrors = filterSqlErrors(err);
      return makeRes(401, 'Unable to authenticate.', fieldErrors);
    }

    return makeRes(200, 'Authentication successful.', { token, organizations });
  }

  return makeRes(401, 'Unable to authenticate.', resErrors(['Invalid credentials.']));
};

const verifyEmail = async (userId, userEmailId, { token }) => {
  if (typeof token === 'undefined') {
    return makeRes(400, 'Unable to verify email address.', resErrors(['Invalid verification token.']));
  }

  // TODO: find a way to get userEmail and userEmailVerification in a single step.
  // include option didn't work
  let err, userEmailVerification;
  [err, userEmailVerification] = await to(UserEmailVerifications.findOne({
    where: {
      userEmailId
    }
  }));

  if (err) {
    logger.error(err);
    return makeRes(400, 'Unable to verify email address.');
  }

  if (!userEmailVerification) {
    return makeRes(400, 'Unable to verify email address.');
  }

  let userEmail;
  [err, userEmail] = await to(UserEmails.findByPk(userEmailId));

  if (err) {
    logger.error(err);
    return makeRes(400, 'Unable to verify email address.');
  }

  if (!userEmail || userEmailVerification.token !== token || userEmail.userId != userId) {
    return makeRes(400, 'Unable to verify email address.');
  }

  let deletedEmailVerification;
  if (!userEmail.verified) {
    [err, deletedEmailVerification] = await to(db.transaction(t => {
      return UserEmailVerifications.destroy({
        where: {
          userEmailId: userEmail.id,
          token
        },
        transaction: t
      }).then(updatedUserEmail => {
        return UserEmails.update({ verified: '1' }, {
          where: {
            id: userEmail.id
          },
          fields: ['verified'],
          transaction: t
        });
      });
    }));

    if (err) {
      logger.error(err);
      return makeRes(400, 'Unable to verify email address.');
    }
  } else {
    [err, deletedEmailVerification] = await to(UserEmailVerifications.destroy({
      where: {
        userEmailId: userEmail.id
      }
    }));

    if (err) {
      logger.error(err);
      return makeRes(400, 'Unable to verify email address.');
    }
  }

  return makeRes(200, 'Successfully verified email address.');
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
  verifyEmail,
  hasPermission
};
