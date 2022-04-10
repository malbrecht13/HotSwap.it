const express = require('express');
const router = express.Router();
const tradeCtrl = require('../controllers/trade');

router
    .route('/ship-item')
    .post(tradeCtrl.itemHasShipped)

router
    .route('/cancel-trade')
    .post(tradeCtrl.cancelTrade)

router
    .route('/rate-trader')
    .post(tradeCtrl.rateTrader)

module.exports = router;