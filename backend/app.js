const express = require('express');
const app = express();
const morgan = require('morgan'); // http request logger middleware

require('dotenv/config'); // the dotenv library allows us to use environment variables from .env file
require('./models/db'); //contains the db connection

// Use middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(morgan('tiny'));

// Routes
const api = process.env.API_URL;
const apiRouter = require('./routes/index');
app.use(`${api}`, apiRouter);

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
