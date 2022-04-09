const { UserStore } = require('../models/userStore');
const { TradeItem } = require('../models/tradeItem');

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
        const fileName = req.file.filename;
        const imagePath = `https://${req.get(
            'host'
        )}/public/uploads/${fileName}`;
        //trade item to add
        let tradeItem = new TradeItem({
            name: req.body.name,
            brand: req.body.brand,
            image: imagePath,
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
        return res
            .status(500)
            .send({
                message: 'Error while attempting to add item for trade',
                error: e,
            });
    }
};

const getPreviousTrades = async (req, res) => {
    try {
        //get the user store from the url param
        const { storeId } = req.params;
        //use the id to get the userstore
        let store = await UserStore.findById(storeId).populate('previousTrades');
        if (!store) {
            res.status(404).send({
                success: false,
                message: 'Could not find UserStore',
            });
        }
        //get the previousTrades from the store
        const previousTrades = store.previousTrades;
        res.status(200).send({previousTrades: store});
    } catch (e) {
        res.status(500).send({
            success: false,
            message: 'Server error, cannot get previous trades',
        });
    }
};

module.exports = {
    getItemsForTrade,
    addItemForTrade,
    getPreviousTrades,
    // getAvgRating
};
