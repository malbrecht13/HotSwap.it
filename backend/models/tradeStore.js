const mongoose = require('mongoose');

const tradeStoreSchema = mongoose.Schema({
    searchResults: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TradeItem',
            default: [],
        },
    ],
});

exports.TradeStore = mongoose.model('TradeStore', tradeStoreSchema);
