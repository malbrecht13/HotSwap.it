const express = require('express');
const router = express.Router();
const userStoreCtrl = require('../controllers/userStore');

router
    .route('/current-trades/:userStoreId')
    .get(userStoreCtrl.getItemsForTrade)
    .post(userStoreCtrl.addItemForTrade)
//     .put(userStoreCtrl.updateItemForTrade)
//     .delete(userStoreCtrl.deleteItemForTrade);

// router
//     .route('/previous-trades/:userStoreId')
//     .get(userStoreCtrl.getPreviousTrades);

// router
//     .route('/avg-rating/:userStoreId')
//     .get(userStoreCtrl.getAvgRating);

module.exports = router;
