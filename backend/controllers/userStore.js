const { UserStore } = require('../models/userStore');

const getItemsForTrade = async (req,res) => {
  const userStoreId = req.params.userStoreId;
  try {
    const userStore = await UserStore.findById(userStoreId);
    if(!userStore) {
      return res.status(400).send({message: 'User store bad request'});
    }
    if(!userStore.itemsForTrade) {
      return res.status(404).send({message: 'Trade items not found'});
    }
    return res.status(200).send(userStore.itemsForTrade);
  } catch (e) {
    return res.status(500).send({message: 'Error getting trade items'});
  }
}

module.exports = {
  getItemsForTrade,
  // addItemForTrade,
  // updateItemForTrade,
  // deleteItemForTrade,
  // getPreviousTrades,
  // getAvgRating
}