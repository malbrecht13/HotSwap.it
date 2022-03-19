const fs = require('fs');
const { TradeItem } = require('../models/tradeItem');
const { UserStore } = require('../models/userStore');
const { Trade } = require('../models/trade');
const { Notification } = require('../models/notification');

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
        return res.status(200).send({item: tradeItem});
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ message: 'Error updating item for trade' });
    }
};

const deleteTradeItem = async (req,res) => {
  const itemId = req.params.tradeItemId;
  try {
    //first delete the item from the corresponding UserStore
    const itemToDelete = await TradeItem.findById(itemId);
    if(!itemToDelete) {
      return res.status(404).send({message: 'Item to delete not found'});
    }
    let userStore = await UserStore.findById(itemToDelete.traderStore);
    if(!userStore) {
      return res.status(404).send({message: 'Item to delete\'s store not found'});
    }
    //delete image from file path
    let image = itemToDelete.image;
    const startOfPath = image.indexOf('/public');
    const imagePath = image.substring(startOfPath);
    fs.unlinkSync('../backend' + imagePath);
    
    const newUserStoreItemsForTrade = userStore.itemsForTrade.filter(tradeItemId => {
      return tradeItemId.toString() !== itemId;
    });
   
    userStore = await UserStore.findByIdAndUpdate(
      itemToDelete.traderStore,
      {
        itemsForTrade: newUserStoreItemsForTrade
      },
      { new: true }
    )
    if(!userStore) {
      return res.status(400).send({message: 'User store could not delete the trade item'});
    }

    //then delete the item from the TradeItem collection
    const deletedItem = await TradeItem.findByIdAndRemove(itemId);
    if (!deletedItem) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }
    return res
      .status(200)
      .json({ success: true, message: 'Product successfully deleted' });
  } catch(e) {
    return res.status(500).json({success: false, message: 'Error deleting Trade item'});
  }
}

const acceptOffer = async (req,res) => {
  const offeredItemId = req.params.offeredItemId;
  const tradedItemId = req.params.tradedItemId;
  try {
    // generate and save the new Trade
    let newTrade = new Trade({
      tradeItem: tradedItemId,
      offeredItem: offeredItemId
    });
    newTrade = await newTrade.save();
    if(!newTrade) {
      return res.status(400).send({message: 'New Trade could not be created'});
    }

    // update tradeItem's tradedTo property and change status to "PendingTrade"
    const tradedItem = await TradeItem.findByIdAndUpdate(
      tradedItemId,
      {
        tradedTo: offeredItemId,
        status: 'PendingTrade'
      },
      { new: true}
    )
    if(!tradedItem) {
      return res.status(400).send({message: 'Failed to update Traded Item'});
    }

    // update offeredItem's offeredTo property and change status to "PendingTrade"
    const offeredItem = await TradeItem.findByIdAndUpdate(
      offeredItemId,
      {
        offeredTo: tradedItemId,
        status: 'PendingTrade'
      },
      { new: true}
    )
    if(!offeredItem) {
      return res.status(400).send({message: 'Failed to update Offered Item'});
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
        previousTrades: tradedPreviousTrades
      },
      {new: true}
    )
    if(!tradedItemStore) {
      return res.status(404).send({message: 'Traded item UserStore not found'});
    }
    offeredItemStore = await UserStore.findByIdAndUpdate(
      offeredItemStoreId,
      {
        previousTrades: offeredPreviousTrades
      },
      {new: true}
    )
    if(!offeredItemStore) {
      return res.status(404).send({message: 'Offered item UserStore not found'});
    }

    // Generate notification for offerer
    let offererId = offeredItemStore.user;
    let notification = new Notification({
      user: offererId,
      type: 'Trade Accepted',
      description: `Your offer '${offeredItem.name}' has been accepted for trade item '${tradedItem.name}'`,
    });
    notification = await notification.save();
    if(!notification) {
      res.status(400).send({message: 'Notification could not be generated'});
    }
    // Update user notifications
    let userToNotify = await User.findById(notification.user);
    let userNotifications = userToNotify.notifications;
    userNotifications.push(notification.id);
    userToNotify = await User.findByIdAndUpdate(
      notification.user,
      {
        notifications: userNotifications
      }
    )
    if(!userToNotify) {
      res.status(404).send({message: 'User to notify concerning accepted trade not found'})
    }

    return res.status(200).send(newTrade);
  } catch (e) {
    return res.status(500).send({message: 'Error accepting trade offer'});
  }
}

module.exports = {
    updateItemForTrade,
    deleteTradeItem,
    acceptOffer
};
