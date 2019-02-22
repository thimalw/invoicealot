const router = require('express').Router();

// routes
router.use('/notify', require('./notify'));
router.use('/user', require('./user'));
router.use('/organizations', require('./organizations'));
router.use('/invoices', require('./invoices'));

// TODO: handle unhandled errors

module.exports = router;
