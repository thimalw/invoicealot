const router = require('express').Router();
const passport = require('passport');
const jwtStrategy = require('../utils/jwtStrategy');
const OrganizationController = require('../controllers/OrganizationController');

passport.use(jwtStrategy);

router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const organization = await OrganizationController.create(req.user.id, req.body);
  res.status(organization.status).send(organization);
});

router.post('/:organizationId/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const organizationUser = await OrganizationController.addUser(req.user.id, req.params.organizationId, req.body);
  res.status(organizationUser.status).send(organizationUser);
});

module.exports = router;
