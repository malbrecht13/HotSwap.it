const express = require('express');
const router = express.Router();

const ctrlProducts = require('../controllers/products');
const ctrlOrders = require('../controllers/orders');
const ctrlCategories = require('../controllers/categories');
const ctrlUsers = require('../controllers/users');

router
  .route('/products')
  .get(ctrlProducts.getAllProducts)
  .post(ctrlProducts.createProduct)

router
  .route('/categories')

router
  .route('/orders')

router
  .route('/users')

module.exports = router;