const express = require('express');

const test = express.Router();

function someTest(times = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(times);
        }, times * 1000);
    })
}

test.get('/hello', async (req, res) => {
    someTest(15).then((resp) =>{
        return res.send({
            success: true,
            msg: 'hello',
            data: resp
        })
    })
});

module.exports = test;