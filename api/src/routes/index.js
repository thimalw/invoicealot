const router = require('express').Router();

// routes
router.use('/user', require('./user'));

// TODO: handle unhandled errors

module.exports = router;
