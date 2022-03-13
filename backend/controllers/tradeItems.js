const { TradeItem } = require('../models/tradeItem');
const { UserStore } = require('../models/userStore');

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

module.exports = {
    updateItemForTrade,
    deleteTradeItem
};
