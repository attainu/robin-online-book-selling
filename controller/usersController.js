// import
const userModel = require("../models/userModel");
const { router } = require("../app");


// Create a blank controller
const controller = {};


// create index controller
controller.signup = (req, res, next) => {
    const message = req.flash("error");
    res.render("users/signup", { csrfToken: req.csrfToken() , message: message, hasError: message.length > 0});
}
controller.getSignup = (req, res, next) => {
    const body = {
        user_name: req.body.user_name,
        user_email: req.body.user_email,
        user_password: req.body.user_password,
        user_mobile: req.body.user_mobile,
    }
    const userData = new userModel(body);
    userData.save((err, data) => {
        if (!err) {
            res.redirect("/");
        }
        else {
            const formError = {};
            if (err.name == 'ValidationError') {

                for (field in err.errors) {
                    formError[field] = err.errors[field].message;
                }
                res.render("users/signup",{ status: 0, formError });
            } else if (err.name == "MongoError") {
                formError.product_name = err.keyValue["user_mobile"] + " allready exist";
                res.render("users/signup",{ status: 0, formError });
            }
            else {
                console.log('Error during record insertion : ' + err);
            }

        }
    });
}


controller.signin = (req, res, next) => {
    const message = req.flash("error");
    res.render("users/signin", { csrfToken: req.csrfToken() , message: message, hasError: message.length > 0});
}



controller.logout = (req, res, next) => {
    req.logout();
    req.session.destroy();
    res.redirect("/");
}


controller.account = (req, res, next) => {
    res.render("users/account");
}


module.exports = controller;
