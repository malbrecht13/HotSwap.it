const mongoose = require('mongoose');

mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'hotswap',
    })
    .then(() => {
        console.log('Database connection is ready...');
    })
    .catch((err) => {
        console.log(err);
    });

require('./tradeItem');