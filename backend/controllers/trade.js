const { TradeItem } = require('../models/tradeItem');
const { Trade } = require('../models/trade');
const { UserStore } = require('../models/userStore');
const { User } = require('../models/user');
const { Rating } = require('../models/rating');
const notificationCtrl = require('../controllers/notification');

const itemHasShipped = async (req, res) => {
    try {
        const { itemToShipId, tradeId } = req.body;
        let itemToShip = await TradeItem.findById(itemToShipId);
        // Update itemToShip status
        itemToShip = await TradeItem.findByIdAndUpdate(
            itemToShipId,
            {
                hasShipped: true,
                status: 'ItemShipped',
            },
            { new: true }
        );
        if (!itemToShip) {
            return res
                .status(404)
                .send({ success: false, message: 'Trade item not found' });
        }
        // Check whether only one or both items of the trade have shipped
        // to change the Trade status to the new correct status
        let trade = await Trade.findById(tradeId);
        let newTradeStatus = '';
        if (
            trade.status === 'TraderItemShipped' ||
            trade.status === 'OffererItemShipped'
        ) {
            newTradeStatus = 'BothItemsShipped';
        } else if (trade.tradeItem.toString() === itemToShipId) {
            newTradeStatus = 'TraderItemShipped';
        } else if (trade.offeredItem.toString() === itemToShipId) {
            newTradeStatus = 'OffererItemShipped';
        }
        trade = await Trade.findByIdAndUpdate(tradeId, {
            status: newTradeStatus,
        });
        if (!trade) {
            return res.status(400).send({
                success: false,
                message: 'Could not update trade status',
            });
        }
        // Send notification to the other user that the item is being
        // shipped to them

        // First get the other user's id to use in the notification
        let otherItemId = '';
        if (trade.tradeItem.toString() === itemToShipId) {
            otherItemId = trade.offeredItem.toString();
        } else if (trade.offeredItem.toString() === itemToShipId) {
            otherItemId = trade.tradeItem.toString();
        }
        const otherTradeItem = await TradeItem.findById(otherItemId);
        const otherUserStore = await UserStore.findById(
            otherTradeItem.traderStore
        );
        let otherUser = await User.findById(otherUserStore.user);
        const otherUserId = otherUser.id.toString();
        //create and send the notification
        notificationCtrl.createNotification(otherUserId, 'Item Shipped', itemToShip.name);

        return res.status(200).send({ success: true, shippedItem: itemToShip });
    } catch (e) {
        return res.status(500).send({
            success: false,
            message:
                'Converting hasShipped property to true resulted in an error',
        });
    }
};

const cancelTrade = async (req, res) => {
    try {
        const { tradeId } = req.body;
        // Get the trade and check its status
        let trade = await Trade.findById(tradeId);
        if (!trade) {
            res.status(404).send({
                success: false,
                message: 'Trade not found',
            });
            return;
        }
        // only trades that don't have an item shipped can be cancelled
        if (!(trade.status === 'NoItemsShipped')) {
            res.status(400).send({
                success: false,
                message:
                    'The Trade cannot be canceled because one or more items have already shipped or trade already canceled',
            });
            return;
        }

        // Update Trade, offeredItem, and tradedItem

        // update the trade status
        trade = await Trade.findByIdAndUpdate(tradeId, {
            status: 'TradeCanceled',
        });
        const offeredItemId = trade.offeredItem;
        const tradedItemId = trade.tradeItem;
        // update offeredItem
        let offeredItem = await TradeItem.findByIdAndUpdate(offeredItemId, {
            offeredTo: null,
            status: 'NoOffers',
        });
        // update tradedItem
        let tradedItem = await TradeItem.findById(tradedItemId);
        let tradedItemsOffers = tradedItem.offers.filter(
            (item) => item.toString() !== offeredItemId
        );
        tradedItem = await TradeItem.findByIdAndUpdate(tradedItemId, {
            tradedTo: null,
            status: 'NoOffers',
            offers: tradedItemsOffers,
        });
        if (!offeredItem || !tradedItem) {
            res.status(400).send({
                success: false,
                message: 'Could not update traded item or offered item',
            });
            return;
        }

        //Get user id's to send notifications to both users
        const offeredItemUserStoreId = offeredItem.traderStore;
        const tradedItemUserStoreId = tradedItem.traderStore;
        const offererStore = await UserStore.findById(offeredItemUserStoreId);
        const traderStore = await UserStore.findById(tradedItemUserStoreId);
        if(!offererStore || !traderStore) {
          res.status(404).send({success:false, message: 'UserStore not found'});
          return;
        }
        let offererId = offererStore.user.toString();
        let traderId = traderStore.user.toString();
        //send notifications

        notificationCtrl.createNotification(offererId, 'Trade Canceled', tradedItem.name);
        notificationCtrl.createNotification(traderId, 'Trade Canceled', offeredItem.name);

        return res.status(200).send({
            success: true,
            message: 'Successfully canceled the trade',
        });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: false, message: 'Error canceling the trade' });
    }
};

const rateTrader = async (req, res) => {
    try {
        //Precondition is that both items have shipped
        //We need the tradeId and the Id of the item that is being rated
        //Also need the userStore to add the rating
        const { tradeId, tradeItemId, ratingNum, comment } = req.body;
        const trade = await Trade.findById(tradeId);
        const itemToRate = await TradeItem.findById(tradeItemId).populate('traderStore');
        //make sure both items have shipped by checking the status of the trade
        const tradeStatus = trade.status;
        if (!tradeStatus === 'BothItemsShipped') {
            res.status(400).send({
                success: false,
                message:
                    'Cannot rate the trade item until both items of the trade have shipped',
            });
            return;
        }
        //create the rating
        let rating = new Rating({
            rating: ratingNum,
            comment: comment,
        });
        rating = await rating.save();
        //update the rating in the trade
        let updatedTrade;
        if (tradeItemId === trade.tradeItem.toString()) {
            updatedTrade = await Trade.findByIdAndUpdate(tradeId, {
                ratingOfTrader: rating._id
            });
        } else if (tradeItemId === trade.offeredItem.toString()) {
            updatedTrade = await Trade.findByIdAndUpdate(tradeId, {
                ratingOfOfferor: rating._id
            });
        }
        if (!updatedTrade) {
            res.status(400).send({
                success: false,
                message: 'Could not update rating of trader within the trade',
            });
        }
        //Send notification of rating with comment to the other user
        const userToNotify = itemToRate.traderStore.user;
        notificationCtrl.createNotification(userToNotify, 'Received Rating', itemToRate.name);
        //now add the rating to the UserStore who is being rated
        const userStoreId = itemToRate.traderStore;
        let userStore = await UserStore.findById(userStoreId);
        if (!userStore) {
            res.status(404).send({
                success: false,
                message: 'Could not find User Store',
            });
        }
        //get the userstore ratings and push new rating to it
        let userStoreRatings = userStore.ratings;
        userStoreRatings.push(rating._id);
        //now update the userstore
        userStore = await UserStore.findByIdAndUpdate(userStoreId, {
            ratings: userStoreRatings,
        });
        res.status(200).send({
            success: true,
            message:
                'Successfully rated the tradeItem and updated UserStore with rating',
        });
    } catch (e) {
        res.status(500).send({
            success: false,
            message: 'There was an error rating the trader for this trade',
            error: e,
        });
    }
};

module.exports = {
    itemHasShipped,
    cancelTrade,
    rateTrader,
};
