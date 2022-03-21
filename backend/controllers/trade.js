const { TradeItem } = require('../models/tradeItem');

const itemHasShipped = async (req, res) => {
  try {
      const tradeItemId = req.params.tradeItemId;
      // Do not allow to ship unless status is "PendingTrade"
      let tradeItem = await TradeItem.findById(tradeItemId);
      let status = tradeItem.status;
      console.log(status);
      if (status !== 'PendingTrade') {
          return res
              .status(400)
              .send({
                  success: false,
                  message:
                      'The item selected to ship is not in a pending trade',
              });
      }
      tradeItem = await TradeItem.findByIdAndUpdate(
          tradeItemId,
          {
              hasShipped: true,
              status: 'ItemShipped'
          },
          { new: true }
      );
      if(!tradeItem) {
        return res.status(404).send({success: false, message: 'Trade item not found'});
      }
      // If tradeItem.offeredTo is not null, then that means it is the offered item and this
      // tradeItem is the offeredItem.  Otherwise, it's the tradedItem
      if(tradeItem.offeredTo) {
        
      }

      return res.status(200).send({tradeItem: tradeItem});
  } catch (e) {
      return res
          .status(500)
          .send({
              success: false,
              message:
                  'Converting hasShipped property to true resulted in an error',
          });
  }
};

module.exports = {
  itemHasShipped
}