const { TradeItem } = require('../models/tradeItem');

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

module.exports = {
    updateItemForTrade,
};
