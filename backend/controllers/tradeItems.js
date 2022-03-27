const fs = require('fs');
const { TradeItem } = require('../models/tradeItem');
const { UserStore } = require('../models/userStore');
const { Trade } = require('../models/trade');
const { Notification } = require('../models/notification');
const { User } = require('../models/user');

const updateItemForTrade = async (req, res) => {
    const tradeItemId = req.params.tradeItemId;
    try {
        // the following is needed to add the image
        const file = req.file;
        if (!file) {
            return res.status(400).send({ message: 'No image in the request' });
        }
        const fileName = req.file.filename;
        const imagePath = `${req.protocol}://${req.get(
            'host'
        )}/public/uploads/${fileName}`;
        let tradeItem = await TradeItem.findByIdAndUpdate(
            tradeItemId,
            {
                name: req.body.name,
                brand: req.body.brand,
                image: imagePath,
                condition: req.body.condition,
                itemCategory: req.body.itemCategory,
                description: req.body.description,
                approximateMarketVal: req.body.approximateMarketVal,
            },
            { new: true }
        );
        if (!tradeItem) {
            return res
                .status(400)
                .send({ message: 'The trade item could not be updated' });
        }
        return res.status(200).send({ item: tradeItem });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ message: 'Error updating item for trade' });
    }
};

const deleteTradeItem = async (req, res) => {
    const itemId = req.params.tradeItemId;
    try {
        //first delete the item from the corresponding UserStore
        const itemToDelete = await TradeItem.findById(itemId);
        if (!itemToDelete) {
            return res
                .status(404)
                .send({ message: 'Item to delete not found' });
        }
        let userStore = await UserStore.findById(itemToDelete.traderStore);
        if (!userStore) {
            return res
                .status(404)
                .send({ message: "Item to delete's store not found" });
        }
        //delete image from file path
        let image = itemToDelete.image;
        const startOfPath = image.indexOf('/public');
        const imagePath = image.substring(startOfPath);
        fs.unlinkSync('../backend' + imagePath);

        const newUserStoreItemsForTrade = userStore.itemsForTrade.filter(
            (tradeItemId) => {
                return tradeItemId.toString() !== itemId;
            }
        );

        userStore = await UserStore.findByIdAndUpdate(
            itemToDelete.traderStore,
            {
                itemsForTrade: newUserStoreItemsForTrade,
            },
            { new: true }
        );
        if (!userStore) {
            return res.status(400).send({
                message: 'User store could not delete the trade item',
            });
        }

        //then delete the item from the TradeItem collection
        const deletedItem = await TradeItem.findByIdAndRemove(itemId);
        if (!deletedItem) {
            return res
                .status(404)
                .json({ success: false, message: 'Product not found' });
        }
        //TODO: Notify any offerers when a trade item is deleted
        return res
            .status(200)
            .json({ success: true, message: 'Product successfully deleted' });
    } catch (e) {
        return res
            .status(500)
            .json({ success: false, message: 'Error deleting Trade item', err: e});
    }
};

const makeOffer = async (req, res) => {
    try {
        const tradedItemId = req.body.tradedItemId;
        const offeredItemId = req.body.offeredItemId;
        // first make sure the offeredItem doesn't have any offers and is not already offered
        let offeredItem = await TradeItem.findById(offeredItemId);
        if (!offeredItem) {
            return res
                .status(404)
                .send({ message: 'Offered item ID not found' });
        }
        if (offeredItem.offeredTo || offeredItem.offers.length) {
            return res
                .status(400)
                .send({ message: 'This item is not available for trading' });
        }
        // add the offeredItem to the tradedItem's offers and update tradeItem's status to 'ReceivedOffers'
        let tradeItem = await TradeItem.findById(tradedItemId);
        let tradeItemOffers = tradeItem.offers;
        tradeItemOffers.push(offeredItemId);
        tradeItem = await TradeItem.findByIdAndUpdate(tradedItemId, {
            offers: tradeItemOffers,
            status: 'ReceivedOffers',
        });

        if (!tradeItem) {
            return res
                .status(404)
                .send({ message: 'Could not find TradeItem to update' });
        }

        // update offeredItem status to "Offered" and add tradeItemId as the offeredTo property
        offeredItem = await TradeItem.findByIdAndUpdate(offeredItemId, {
            offeredTo: tradedItemId,
            status: 'Offered',
        });
        if (!offeredItem) {
            return res
                .status(400)
                .send({ message: 'Could not update offered item' });
        }
        return res.status(200).send({ message: 'Offer made successfully' });
    } catch (e) {
        return res
            .status(500)
            .send({ message: 'Error when attempting to make the offer' });
    }
};

const acceptOffer = async (req, res) => {
    try {
        const offeredItemId = req.body.offeredItemId;
        let offeredItem = await TradeItem.findById(offeredItemId);
        let tradedItemId = offeredItem.offeredTo.toString();
        if (!offeredItem) {
            return res
                .status(404)
                .send({ success: false, message: 'Offered item not found' });
        }
        if (!tradedItemId) {
            return res
                .status(404)
                .send({ success: false, message: 'Traded item not found' });
        }
        // generate and save the new Trade
        let newTrade = new Trade({
            tradeItem: tradedItemId,
            offeredItem: offeredItemId,
        });
        newTrade = await newTrade.save();
        if (!newTrade) {
            return res
                .status(400)
                .send({ message: 'New Trade could not be created' });
        }

        // update tradeItem's tradedTo property and change status to "PendingTrade"
        const tradedItem = await TradeItem.findByIdAndUpdate(
            tradedItemId,
            {
                tradedTo: offeredItemId,
                status: 'PendingTrade',
            },
            { new: true }
        );
        if (!tradedItem) {
            return res
                .status(400)
                .send({ message: 'Failed to update Traded Item' });
        }

        // update offeredItem's tradedTo property and status to "PendingTrade"
        offeredItem = await TradeItem.findByIdAndUpdate(
            offeredItemId,
            {
                tradedTo: tradedItemId,
                status: 'PendingTrade',
            },
            { new: true }
        );
        if (!offeredItem) {
            return res
                .status(400)
                .send({ message: 'Failed to update Offered Item' });
        }

        // Add this Trade to previousTrade's list in each user's UserStore
        const tradedItemStoreId = tradedItem.traderStore;
        const offeredItemStoreId = offeredItem.traderStore;
        let tradedItemStore = await UserStore.findById(tradedItemStoreId);
        let offeredItemStore = await UserStore.findById(offeredItemStoreId);
        let tradedPreviousTrades = tradedItemStore.previousTrades;
        let offeredPreviousTrades = offeredItemStore.previousTrades;
        tradedPreviousTrades.push(newTrade.id);
        offeredPreviousTrades.push(newTrade.id);
        tradedItemStore = await UserStore.findByIdAndUpdate(
            tradedItemStoreId,
            {
                previousTrades: tradedPreviousTrades,
            },
            { new: true }
        );
        if (!tradedItemStore) {
            return res
                .status(404)
                .send({ message: 'Traded item UserStore not found' });
        }
        offeredItemStore = await UserStore.findByIdAndUpdate(
            offeredItemStoreId,
            {
                previousTrades: offeredPreviousTrades,
            },
            { new: true }
        );
        if (!offeredItemStore) {
            return res
                .status(404)
                .send({ message: 'Offered item UserStore not found' });
        }
        //FIXME: offererId may not be correct
        // Generate notification for offerer
        let offererId = offeredItemStore.user;
        let notification = new Notification({
            user: offererId,
            type: 'Trade Accepted',
            description: `Your offer '${offeredItem.name}' has been accepted for trade item '${tradedItem.name}'`,
        });
        notification = await notification.save();
        if (!notification) {
            res.status(400).send({
                message: 'Notification could not be generated',
            });
        }
        // Update user's notifications
        let userToNotify = await User.findById(notification.user);
        let userNotifications = userToNotify.notifications;
        userNotifications.push(notification.id);
        userToNotify = await User.findByIdAndUpdate(notification.user, {
            notifications: userNotifications,
        });
        if (!userToNotify) {
            res.status(404).send({
                message: 'User to notify concerning accepted trade not found',
            });
        }

        return res.status(200).send(newTrade);
    } catch (e) {
        return res.status(500).send({ message: 'Error accepting trade offer', error: e});
    }
};

const rejectOffer = async (req, res) => {
    try {
        const offeredItemId = req.params.offeredItemId;
        const tradedItemId = req.params.tradedItemId;
        removeOffer(tradedItemId, offeredItemId);

        // Send a rejection notification to the offerer
        let offeredItem = await TradeItem.findById(offeredItemId);
        let tradedItem = await TradeItem.findById(tradedItemId);
        let offererStore = await UserStore.findById(offeredItem.traderStore);
        let offerer = await User.findById(offererStore.user.toString());
        let userId = offerer._id.toString();
        let notification = new Notification({
            user: userId,
            type: 'Offer Rejected',
            description: `Your offer ${offeredItem.name} has been rejected for trade item ${tradedItem.name}`,
        });
        notification = await notification.save();
        if (!notification) {
            return res.send({
                success: false,
                message: 'Could not create rejection notification',
            });
        }
        let offererNotifications = offerer.notifications;
        offererNotifications.push(notification);
        offerer = await User.findByIdAndUpdate(userId, {
            notifications: offererNotifications,
        });
        if (!offerer) {
            return res.status(404).send({
                success: false,
                message: 'Offeror notifications could not be updated',
            });
        }
        return res.status(200).send({
            success: true,
            message: 'Trade offer successfully was rejected',
            notification: notification,
        });
    } catch (e) {
        return res
            .status(500)
            .send({ success: false, message: 'Error rejecting offer' });
    }
};

// this is a non-exported function to be used both by rejectOffer
// and cancelOffer exported functions.  It removes the offer from the
// tradeItem's offers array and also sets the offeredItem's
// offeredTo property to null
const removeOffer = async (tradedItemId, offeredItemId) => {
    // Remove from tradeItem's offers array, updating status if needed
    let tradedItem = await TradeItem.findById(tradedItemId);
    if (!tradedItem) {
        return res
            .status(404)
            .send({ success: false, message: 'Traded Item not found' });
    }
    let offers = tradedItem.offers;
    offers = offers.filter((offer) => offer.toString() !== offeredItemId);
    let tradedItemStatus = offers.length ? 'ReceivedOffers' : 'NoOffers';

    tradedItem = await TradeItem.findByIdAndUpdate(tradedItemId, {
        offers: offers,
        status: tradedItemStatus,
    });
    if (!tradedItem) {
        return res.status(400).send({
            success: false,
            message: 'Trade Item offers could not be updated',
        });
    }
    // Set the offeredItem's offeredTo property to null and update status
    let offeredItem = await TradeItem.findByIdAndUpdate(offeredItemId, {
        offeredTo: null,
        status: 'NoOffers',
    });
    if (!offeredItem) {
        return res.status(400).send({
            success: false,
            message: 'Offered item offeredTo property could not be updated',
        });
    }
};

const cancelOffer = async (req, res) => {
    try {
        const offeredItemId = req.params.offeredItemId;
        const tradedItemId = req.params.tradedItemId;
        removeOffer(tradedItemId, offeredItemId);
        return res
            .status(200)
            .send({ success: true, message: 'Offer succesfully cancelled' });
    } catch (e) {
        return res
            .status(500)
            .send({ success: false, message: 'Error cancelling offer' });
    }
};



module.exports = {
    updateItemForTrade,
    deleteTradeItem,
    makeOffer,
    acceptOffer,
    rejectOffer,
    cancelOffer,
};
