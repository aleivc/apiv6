const express = require('express');

const app = express();

require('dotenv').config()

app.use(express.json());

app.use('/api/test', require('./controller/test'));

app.listen(3005, () => {
    console.log('server listening on 3005');
})