const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.delete('/user/:id', userController.deleteUser);
router.put('/user/:id', userController.updateUser);
router.get('/me', userController.getMe);

module.exports = router;
