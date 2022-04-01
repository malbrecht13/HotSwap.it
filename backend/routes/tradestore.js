const express = require('express');
const router = express.Router();
const tradeStoreCtrl = require('../controllers/tradestore');

router
  .route('/')
  .get(tradeStoreCtrl.searchTradeItems);

module.exports = router;