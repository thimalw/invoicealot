const router = require('express').Router();
const passport = require('passport');
const jwtStrategy = require('../utils/jwtStrategy');
const OrganizationController = require('../controllers/OrganizationController');

passport.use(jwtStrategy);

router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const organization = await OrganizationController.create(req.user.id, req.body);
  res.status(organization.status).send(organization);
});

module.exports = router;
