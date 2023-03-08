const express = require('express');

const app = express();

require('dotenv').config()

app.use(express.json());

app.use('/sim', require('./controller/sim'));

app.listen(3005, () => {
    console.log('server listening on 3005');
})