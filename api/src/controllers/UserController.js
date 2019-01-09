const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { makeRes, to, filterSqlErrors } = require('../utils/helpers');
const db = require('../../db');

const User = db.import(__dirname + '/../models/User');

const create = async (user) => {
  // save user to database
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
  [err, userInfo] = await to(User.findOne({ email }));

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

module.exports = {
  create,
  authenticate,
  read
};
