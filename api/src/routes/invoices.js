const router = require('express').Router();
const passport = require('passport');
const jwtStrategy = require('../utils/jwtStrategy');
const InvoiceController = require('../controllers/InvoiceController');

passport.use(jwtStrategy);

router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  const invoice = await InvoiceController.create(req.user.id, req.body);
  res.status(invoice.status).send(invoice);
});

module.exports = router;
