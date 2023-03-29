const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

require('dotenv').config()

app.use(express.json());

app.use('/api/sim', require('./controller/sim'));

app.listen(3005, () => {
    console.log('server listening on 3005');
})