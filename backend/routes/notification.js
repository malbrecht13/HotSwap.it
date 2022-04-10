const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controllers/notification');

router
  .route('/:notificationId')
  .delete(notificationCtrl.deleteNotification)

module.exports = router;