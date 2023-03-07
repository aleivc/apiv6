const express = require('express');

const test = express.Router();

test.get('/getDate', async (req, res) => {
    return res.send({
        success: true,
        msg: 'get success',
        data: new Date()
    })
})

test.post('/setDate', async (req, res) => {
    return res.send({
        success: true,
        msg: 'post success',
    })
})


module.exports = test;