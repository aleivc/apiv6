const express = require('express');

const test = express.Router();

test.get('/getDate', async (req, res) => {
    return res.send({
        success: true,
        msg: 'get success',
        data: [1, process.env.NAME2]
    })
})

test.post('/setDate', async (req, res) => {
    return res.send({
        success: true,
        msg: 'post success',
        data: [1, process.env.NAME]
    })
})


module.exports = test;