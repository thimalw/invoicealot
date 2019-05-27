const router = require('express').Router();
const BillingController = require('../controllers/BillingController');

router.post('/payhere/preapprove', async (req, res) => {
  const preapproved = await BillingController.payherePreapprove(req.body);
  res.status(preapproved.status || 500).send(preapproved);
});

module.exports = router;
