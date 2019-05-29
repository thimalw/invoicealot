const router = require('express').Router();

// routes
router.use('/notify', require('./notify'));
router.use('/user', require('./user'));
// router.use('/invoices', require('./invoices'));
router.use('/organizations', require('./organizations'));

// TODO: handle unhandled errors

module.exports = router;
