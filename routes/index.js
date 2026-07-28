const express = require('express');
const router = express.Router();
const {getUserLocation} = require('../controller/location/get-user-location.controller');
const {setDiscountByLocation, getAllDiscountCodes, createDiscountCode, deleteDiscountCode} = require('../controller/discount/discount.controller')
const { createAppMessage, updateAppMessage, deleteAppMessage, getAllAppMessages } = require('../controller/in-app-messages/messages.controller');
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require('../controller/product/product.controller');
const { getCartItems, addToCart, updateCartItem, deleteCartItem, clearCart } = require('../controller/cart/cart.controller');
const { getAdminPanel, adminLogin, adminLogout } = require('../controller/admin-panel.controller');
const { registerUser, requestOtp, verifyOtp } = require('../controller/user/user.controller');

router.get('/admin', getAdminPanel);
router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);

router.post('/v1/user/register', registerUser);
router.post('/v1/user/request-otp', requestOtp);
router.post('/v1/user/verify-otp', verifyOtp);

router.get('/v1/location/get' , getUserLocation);
router.get('/v1/discount/location/get' , setDiscountByLocation);
router.get('/v1/discount/all/get', getAllDiscountCodes);
router.post('/v1/discount/create', createDiscountCode);
router.delete('/v1/discount/delete/:id', deleteDiscountCode);
router.post('/v1/messages/create', createAppMessage);
router.put('/v1/messages/update/:id', updateAppMessage);
router.delete('/v1/messages/delete/:id', deleteAppMessage);
router.get('/v1/messages/all/get', getAllAppMessages);
router.get('/v1/products/all/get', getAllProducts);
router.post('/v1/products/create', createProduct);
router.put('/v1/products/update/:id', updateProduct);
router.delete('/v1/products/delete/:id', deleteProduct);
router.get('/v1/cart/all/get', getCartItems);
router.post('/v1/cart/add', addToCart);
router.put('/v1/cart/update/:id', updateCartItem);
router.delete('/v1/cart/delete/:id', deleteCartItem);
router.post('/v1/cart/clear', clearCart);

module.exports = router;