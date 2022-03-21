const { TradeItem } = require('../models/tradeItem');
const { Trade } = require('../models/trade');
const { Notification } = require('../models/notification');
const { UserStore } = require('../models/userStore');
const { User } = require('../models/user');

const itemHasShipped = async (req, res) => {
    try {
        const itemToShipId = req.params.itemToShipId;
        const tradeId = req.params.tradeId;
        // Do not allow to ship unless status is "PendingTrade"
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
            return res
                .status(400)
                .send({
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
        let notification = new Notification({
            user: otherUserId,
            type: 'Item Shipped',
            description: `Your trade partner has shipped their item: ${itemToShip.name}`,
        });
        notification = await notification.save();
        let otherUserNotifications = otherUser.notifications;
        otherUserNotifications.push(notification.id);
        otherUser = await User.findByIdAndUpdate(otherUser.id, {
            notifications: otherUserNotifications,
        });
        if (!notification || !otherUser) {
          console.log(notification)
          console.log(otherUser)
            return res
                .status(400)
                .send({
                    success: false,
                    message:
                        'Could not send notification to the other user that item has shipped',
                });
        }

        return res.status(200).send({ success: true, shippedItem: itemToShip });
    } catch (e) {
        return res.status(500).send({
            success: false,
            message:
                'Converting hasShipped property to true resulted in an error',
        });
    }
};

const cancelTrade = async(req,res) => {
  try {
    const { tradeId } = req.body;
  // Get the trade and check its status
  let trade = await Trade.findById(tradeId);
  if(!trade) {
    res.status(404).send({success: false, message: 'Trade not found'});
  }
  // only trades that don't have an item shipped can be cancelled
  if (!(trade.status === 'NoItemsShipped')) {
    console.log('here');
    res.status(400).send({success: false, message: 'The Trade cannot be cancelled because one or more items have already shipped or trade already cancelled'});
    return;
  }

  // Update Trade, offeredItem, and tradedItem

  // update the trade status
  trade = await Trade.findByIdAndUpdate(
    tradeId,
    {
      status: 'TradeCancelled'
    }
  )
  const offeredItemId = trade.offeredItem;
  const tradedItemId = trade.tradeItem;
  // update offeredItem
  let offeredItem = await TradeItem.findByIdAndUpdate(
    offeredItemId,
    {
      offeredTo: null,
      status: 'NoOffers'
    }
  )
  // update tradedItem
  let tradedItem = await TradeItem.findById(tradedItemId);
  let tradedItemsOffers = tradedItem.offers.filter(item => item.toString() !== offeredItemId);
  tradedItem = await TradeItem.findByIdAndUpdate(
    tradedItemId,
    {
      tradedTo: null,
      status: 'NoOffers',
      offers: tradedItemsOffers
    }
  )
  if (!offeredItem || !tradedItem) {
    res.status(400).send({success: false, message: 'Could not update traded item or offered item'});
  }
  
  return res.status(200).send({success: true, message: 'Succesfully cancelled the trade'});

  } catch(e) {
    return res.status(500).send({success: false, message: 'Error cancelling the trade'});
  }
  


}

module.exports = {
    itemHasShipped,
    cancelTrade
};
