const express = require('express');

const test = express.Router();

test.get('/getDate', async (req, res) => {
    return res.send({
        success: true,
        msg: 'get success',
        data: 'some changes'
    })
})

test.post('/setDate', async (req, res) => {
    return res.send({
        success: true,
        msg: 'post success',
        data: 'some changes'
    })
})


module.exports = test;