const { UserStore } = require('../models/userStore');
const { TradeItem } = require('../models/tradeItem');
const { uploadFile, getFileStream } = require('../s3');

const getItemsForTrade = async (req, res) => {
    const userStoreId = req.params.userStoreId;
    try {
        const userStore = await UserStore.findById(userStoreId).populate(
            'itemsForTrade'
        );
        if (!userStore) {
            return res.status(400).send({ message: 'User store bad request' });
        }
        if (!userStore.itemsForTrade) {
            return res.status(404).send({ message: 'Trade items not found' });
        }
        return res.status(200).send({ itemsForTrade: userStore.itemsForTrade });
    } catch (e) {
        return res.status(500).send({ message: 'Error getting trade items' });
    }
};

const addItemForTrade = async (req, res) => {
    const userStoreId = req.params.userStoreId;
    try {
        // the following is needed to add the image
        const file = req.file;
        if (!file) {
            return res.status(400).send({ message: 'No image in the request' });
        }
        const result = await uploadFile(file);
        const imageKey = `${result.Key}`;
        console.log(imageKey);
        //trade item to add
        let tradeItem = new TradeItem({
            name: req.body.name,
            brand: req.body.brand,
            image: imageKey,
            condition: req.body.condition,
            itemCategory: req.body.itemCategory,
            description: req.body.description,
            approximateMarketVal: req.body.approximateMarketVal,
            traderStore: userStoreId,
            // note there are several default TradeItem values not listed here
        });
        tradeItem = await tradeItem.save();
        if (!tradeItem) {
            return res
                .status(400)
                .send({ message: 'Trade item could not be saved' });
        }
        let userStore = await UserStore.findById(userStoreId);
        if (!userStore) {
            return res.status(404).send({ message: 'User store not found' });
        }
        let itemsForTrade = userStore.itemsForTrade;
        itemsForTrade.push(tradeItem); //add the tradeItem to the array.

        // now update the userStore with the new itemsForTrade array with the new item added
        userStore = await UserStore.findByIdAndUpdate(
            userStoreId,
            {
                itemsForTrade: itemsForTrade,
            },
            { new: true }
        );

        if (!userStore) {
            return res
                .status(400)
                .send({ message: 'The trade item could not be added' });
        }
        return res
            .status(201)
            .send({ itemAdded: tradeItem, userStore: userStore });
    } catch (e) {
        return res.status(500).send({
            message: 'Error while attempting to add item for trade',
            error: e,
        });
    }
};

const getPreviousTrades = async (req, res) => {
    try {
        //get the user store from the url param
        const { userStoreId } = req.params;
        //use the id to get the userstore
        let store = await UserStore.findById(userStoreId).populate(
            'previousTrades'
        );
        if (!store) {
            res.status(404).send({
                success: false,
                message: 'Could not find UserStore',
            });
            return;
        }
        //get the previousTrades from the store
        const previousTrades = store.previousTrades;
        res.status(200).send({ previousTrades: previousTrades });
    } catch (e) {
        res.status(500).send({
            success: false,
            message: 'Server error, cannot get previous trades',
        });
    }
};

const getAvgRating = async (req, res) => {
    try {
        //get the userStoreId from params
        const { userStoreId } = req.params;
        //use the id to get the userStore
        const avgRating = await updateAvgRating(userStoreId, res);
        if (!avgRating) {
            res.status(200).send({ userAvgRating: null });
            return;
        }
        return res.status(200).send({ userAvgRating: avgRating });
    } catch (e) {
      console.log(e.message);
        res.status(500).send({
            success: false,
            message: 'Server error, cannot get average user rating',
        });
    }
};

//This function is not exported.  Used within getAvgRating
const updateAvgRating = async (userStoreId, res) => {
    const store = await UserStore.findById(userStoreId).populate('ratings');
    if (!store) {
        res.status(404).send({
            success: false,
            message: 'Could not find UserStore',
        });
    }
    //get the numbers from the ratings
    const ratings = store.ratings.map((rating) => rating.rating);
    const reducerFunc = (total, currentNum) => total + currentNum;
    const rating = ratings.reduce(reducerFunc, 0);
    return rating;
};

const getImage = async(req, res) => {
  const key = req.params.key;
  const readStream = getFileStream(key);

  readStream.pipe(res);
}

module.exports = {
    getItemsForTrade,
    addItemForTrade,
    getPreviousTrades,
    getAvgRating,
    getImage
};
