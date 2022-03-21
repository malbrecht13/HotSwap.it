const express = require('express');
const router = express.Router();
const tradeCtrl = require('../controllers/trade');

router
    .route('/ship-item/:itemToShipId/ofTrade/:tradeId')
    .post(tradeCtrl.itemHasShipped)

router
    .route('/cancel-trade')
    .post(tradeCtrl.cancelTrade)

module.exports = router;