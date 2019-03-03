const router = require('express').Router();
const passport = require('passport');
const jwtStrategy = require('../utils/jwtStrategy');
const OrganizationController = require('../controllers/OrganizationController');
const InvoiceController = require('../controllers/InvoiceController');

passport.use(jwtStrategy);

router.get('/plans', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const organizationPlans = await OrganizationController.listPlans(req.user.id);
  res.status(organizationPlans.status).send(organizationPlans);
});

router.post('/:organizationId/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const organizationUser = await OrganizationController.addUser(req.user.id, req.params.organizationId, req.body);
  res.status(organizationUser.status).send(organizationUser);
});

router.get('/:organizationId/invoices/:invoiceId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const invoice = await InvoiceController.get(req.user.id, req.params.organizationId, req.params.invoiceId, 'invoice');
  res.status(invoice.status).send(invoice);
});

router.get('/:organizationId/invoices', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const invoices = await InvoiceController.list(req.user.id, req.params.organizationId, 'invoice');
  res.status(invoices.status).send(invoices);
});

router.post('/:organizationId/invoices', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const invoice = await InvoiceController.create(req.user.id, req.params.organizationId, req.body);
  res.status(invoice.status).send(invoice);
});

router.get('/:organizationId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const organization = await OrganizationController.get(req.user.id, req.params.organizationId);
  res.status(organization.status).send(organization);
});

router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const organization = await OrganizationController.create(req.user.id, req.body);
  res.status(organization.status).send(organization);
});

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const organizations = await OrganizationController.list(req.user.id);
  res.status(organizations.status).send(organizations);
});

module.exports = router;
