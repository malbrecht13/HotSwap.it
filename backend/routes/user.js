const express = require('express');
const router = express.Router();
const ctrlUsers = require ('../controllers/users');

router
  .route('/login')
  .post(ctrlUsers.login)

router
  .route('/register')
  .post(ctrlUsers.register)

router
  .route('/update/username/:id')
  .patch(ctrlUsers.updateUsername)

router
  .route('/update/password/:id')
  .patch(ctrlUsers.updatePassword)

router
  .route('/update/address/:id')
  .patch(ctrlUsers.updateAddress)

module.exports = router;