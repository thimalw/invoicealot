const Strategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { to } = require('./helpers');
const User = require('../../db').model('user');

const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = 'SECRET_KEY'; // TODO

module.exports = new Strategy(opts, async (jwt_payload, done) => {
  let err, user;
  [err, user] = await to(User.findByPk(jwt_payload.id));

  if (!err) {
    return done(null, user);
  }
  
  return done(null, false);
});
