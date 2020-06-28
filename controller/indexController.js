// import
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const orderModel = require("../models/orderModel");
const { session } = require("passport");
const mongoose = require("mongoose");

// Create a blank controller
const controller = {};


// create index controller
controller.index = (req, res, next) => {
    productModel.find((err, data) => {
        for (let x in data) {
            const mrp = data[x].product_mrp;
            const price = data[x].product_price;
            const per = Math.trunc(100 - ((100 * price) / mrp));
            data[x].discount = "-" + per + "%";
        }
        if (!err) {
            categoryModel.find((e, cat)=>{
                if(!err) return res.render('index', { list: data, catList: cat, title: 'Online Grocery', success: req.flash("success")});
                return res.render('index', { list: data,catList: [], title: 'Online Grocery', success: req.flash("success")});
            }).lean();
        }
        else return res.render('index', { list: {}, title: 'Online Grocery' });
    }).limit(10).lean();

}

controller.products = (req, res, next) => {
    productModel.find({product_slag: req.params.slag }, (err, data) => {
        for (let x in data) {
            const mrp = data[x].product_mrp;
            const price = data[x].product_price;
            const per = Math.trunc(100 - ((100 * price) / mrp));
            data[x].discount = "-" + per + "%";
        }
        if (!err) return res.render('products', { list: data, title: 'Online Grocery', success: req.flash("success")});
        else return res.render('products', { list: {}, title: 'Online Grocery' });
    }).lean();

}


controller.addToCart = (req, res, next) => {
    const slag = req.params.slag;
    productModel.findOne({product_slag: slag }, (err, data) => {
        if(err){
            console.log(err);
        }else{
            console.log(data);
            let newItem = true;
            if(typeof req.session.cart == "undefined"){
                req.session.cart = [];
                req.session.cart.push(
                    {
                        product_name: data.product_name,
                        product_slag: data.product_slag,
                        product_price: data.product_price,
                        qty:1,
                    }
                )
            }else{
                let cart = req.session.cart;
                for(let i = 0; i < cart.length; i++){
                    if(cart[i]["product_slag"] == slag){
                        cart[i].qty++;
                        newItem = false;
                        break;
                    }
                }
                if(newItem){
                    req.session.cart.push(
                        {
                            product_name: data.product_name,
                            product_price: data.product_price,
                            product_slag: data.product_slag,
                            qty:1,
                        }
                    )
                }
            }
        }

        req.flash("success", "Product Added");
        res.redirect("back");
    }).lean();
}


controller.yourCart = (req, res, next) => {
    let cart= req.session.cart;
    let totalAmount = 0;
    if(typeof cart == "undefined"){
        cart = [];
    }else{
        
        for(let i = 0; i < cart.length; i++){
            cart[i].subtotal = cart[i].product_price * cart[i].qty;
            totalAmount+= cart[i].subtotal;
        }
    }
    res.render("cart", {cart: cart, success: req.flash("success"), totalAmount: totalAmount});
}

controller.checkout = (req, res, next) => {
    res.render("checkout", {errors: req.flash("error")});
}
controller.getCheckout = (req, res, next) => {
    req.checkBody("name", "Name is Required").notEmpty();
    req.checkBody("address", "Address is Required").notEmpty();
    req.checkBody("payment_mode", "Mode is Required").notEmpty();
    const errors = req.validationErrors();
    if(errors){
        const message = [];
        errors.forEach(element => {
            message.push(element.msg);
        });
        req.flash("error", message);
        return res.redirect("/checkout");
    }


    let cart= req.session.cart;
    let totalAmount = 0;
    if(typeof cart == "undefined"){
        cart = [];
    }else{
        
        for(let i = 0; i < cart.length; i++){
            cart[i].subtotal = cart[i].product_price * cart[i].qty;
            totalAmount+= cart[i].subtotal;
        }
    }

    const body = req.body;
    body.cart = cart;
    body.user_id = req.session.passport.user;
    body.total_amount = totalAmount;
    const orderData = new orderModel(body);
    orderData.save((err, data)=>{
        if(err){
            return console.log(err);
        }else{
            delete req.session.cart;
            req.flash("success", "Order Successfull");
            return res.redirect("/order");
        }
    })

}

controller.updateCart = (req, res, next) => {
    let cart= req.session.cart;
    let action = req.query.action;
    let slag = req.params.slag;
    
    for(let i = 0; i < cart.length; i++){
        if(cart[i].product_slag == slag){
            if(action == "add"){
                cart[i].qty++;
            }else if(action == "minus"){
                if(cart[i].qty <= 1){

                }else{
                    cart[i].qty--;
                }
            }else if(action == "remove"){
                if(cart.length == 1){
                    delete req.session.cart;
                }else{
                    cart.splice(i, i);
                }
            }

        }
    }
    req.flash("success", "Cart Updated");
    res.redirect("back");
}

// create index controller
controller.order = (req, res, next) => {
    orderModel.find({user_id: req.session.passport.user},(err, data) => {
        if (!err) {
            for(let i = 0; i < data.length; i++){
                let shippedDate = data[i].shipped_date == null? "Not Shipped Yet" : data[i].shipped_date.toDateString();
                data[i].order_date = data[i].order_date.toDateString();
                data[i].shipped_date = shippedDate;
                data[i].sn = i+1;
                let status = "Pending";
                if(data[i].order_status == 1) {
                status = "Confirmed";
                }else if(data[i].order_status == 2){
                    status = "Delevered";
                }else if(data[i].order_status == 3){
                    status = "Canceled";
                }
                data[i].order_status = status;
            }
            return res.render('order', { list: data, title: 'Online Grocery'});
        }else{
            return res.render('order', { list: {}, title: 'Online Grocery' });
        } 
    }).lean();

}


// Category
controller.category = async (req, res) => {
    const category_slag = req.params.slag;
    try{
        const category1 = await categoryModel.findOne({category_slag: category_slag});
        console.log("Category",category1);

        const product = await productModel.find({"product_category._id": category1._id});
        console.log('Product',product);
        res.render('category', {list: product, layout: "layout"});

    }catch(e){
        console.log("error", e)
    }




    // categoryModel.findOne({category_slag: category_slag},(err, data) => {
    //     console.log("Data",data)
    //     if (!err) {
    //         const id = data._id;
    //         console.log("Id",id)
    //         productModel.find({"product_category._id": id}, (pError, pData)=>{
    //             if(!pError){
    //                 return res.render('index', { list: pData});
    //             }else{
    //                 console.log(pError);
    //             }
    //         });
    //     }else{
    //         console.log(err)
    //     }
    // });
}

// exporting the controller
module.exports = controller;