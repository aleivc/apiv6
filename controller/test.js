const express = require('express');

const test = express.Router();

test.get('/', (req, res) => {
    res.send('test');
});

module.exports = test;