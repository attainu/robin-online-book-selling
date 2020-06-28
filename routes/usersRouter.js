var express = require('express');
var router = express.Router();
const userController = require("../controller/usersController");
const { check, validationResult } = require('express-validator');
const csrf = require("csurf");
const passport = require('passport');
const csrfProtection = csrf();
router.use(csrf());

router.get('/account', isLoggedIn, userController.account);

router.get('/logout', isLoggedIn, userController.logout);

router.use("/", notLoggedIn, (eq, res, next)=>{
  next();
})

/* GET users listing. */
router.get('/signup', userController.signup);

router.post('/signup', passport.authenticate('local.signup', {
  successRedirect: '/users/account',
  failureRedirect: '/users/signup',
  failureFlash: true
}));

router.get('/signin', userController.signin);

router.post('/signin', passport.authenticate('local.signin', {
  successRedirect: '/users/account',
  failureRedirect: '/users/signin',
  failureFlash: true
}));

// router.post('/signup', userController.getSignup);





module.exports = router;


function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/users/signin");
}

function notLoggedIn(req, res, next){
  if(!req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}