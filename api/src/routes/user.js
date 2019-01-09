const router = require('express').Router();
const UserController = require('../controllers/UserController');

router.post('/', async (req, res) => {
    const user = await UserController.create(req.body);
    res.status(user.status || 500).send(user);
});

router.post('/login', async (req, res) => {
    const token = await UserController.authenticate(req.body);
    res.status(token.status || 500).send(token);
});

router.get('/:id', async (req, res) => {
    const user = await UserController.read(req.params.id);
    res.status(user.status).send(user);
});

module.exports = router;
