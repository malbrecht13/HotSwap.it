const express = require('express');
const app = express();
// const morgan = require('morgan'); // http request logger middleware
const cors = require('cors');

require('dotenv/config'); // the dotenv library allows us to use environment variables from .env file
require('./models/db'); //contains the db connection
const authJwt = require('./helpers/jwt'); // allows user to use api only if authenticated
const errorHandler = require('./helpers/error-handler'); // handle api errors

// Use middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));
// app.use(morgan('tiny'));
app.use(cors());
app.options('*', cors());
app.use(authJwt());  //use to require authorization to access api
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

// Routes
const api = process.env.API_URL;
const userRouter = require('./routes/user');
const tradeItemRouter = require('./routes/tradeItem');
const userStoreRouter = require('./routes/userStore');
const tradeRouter = require('./routes/trade');

app.use(`${api}/users`, userRouter);
app.use(`${api}/userstore`, userStoreRouter);
app.use(`${api}/tradeitems`, tradeItemRouter);
app.use(`${api}/trade`, tradeRouter);

let port;
if (!process.env.NODE_ENV === 'production') {
  port = process.env.PORT || 4200;
}


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
