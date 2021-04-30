const userController = require('../controllers/userControllers');
const express = require('express');
const router = express.Router();
const { check, validationResult }  = require('express-validator');
const middleware = require('../middleWare/auth');

router.get('/health',userController.health);
router.post('/signup', [
    check('name', 'Please enter the name ').not().isEmpty(),
    check('email', 'Please enter email').matches(/.+\@.+\..+/)
    .withMessage("Email must contain @"),
    check('password', 'Please enter the password.').isLength({ min: 6 }),
    check('dob', 'Please enter the date of birth').not().isEmpty(),
    check('description', 'Please enter the Description').not().isEmpty()
],userController.signup);
router.post('/login', [
    check('email', 'Please enter email').matches(/.+\@.+\..+/)
    .withMessage("Email must contain @"),
    check('password', 'Please enter the password.').isLength({ min: 6 })
],userController.login);
router.get('/profile',middleware.isAuth ,userController.userProfile);
router.get('/allUser',middleware.isAuth ,userController.getAllUsers);
router.get('/nearestUsers',middleware.isAuth ,userController.nearestAllUser);
router.put('/updateUser',middleware.isAuth ,userController.updateUser);
router.patch('/updateAddress',middleware.isAuth ,userController.addAddress);
router.put('/follow',middleware.isAuth ,userController.followUser);
router.put('/unFollow',middleware.isAuth ,userController.unFollowUser);

module.exports = router;