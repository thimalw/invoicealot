const router = require('express').Router();
const passport = require('passport');
const jwtStrategy = require('../utils/jwtStrategy');
const UserController = require('../controllers/UserController');

passport.use(jwtStrategy);

router.post('/', async (req, res) => {
  const user = await UserController.create(req.body);
  res.status(user.status || 500).send(user);
});

router.post('/login', async (req, res) => {
  const token = await UserController.authenticate(req.body);
  res.status(token.status || 500).send(token);
});

router.put('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const result = await UserController.update(req.user.id, req.body);
  res.status(result.status).send(result);
});

router.put('/password', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const result = await UserController.updatePassword(req.user.id, req.body);
  res.status(result.status).send(result);
});

router.post('/email/:userEmailId/verify', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const result = await UserController.verifyEmail(req.user.id, req.params.userEmailId, req.body);
  res.status(result.status).send(result);
});

module.exports = router;
