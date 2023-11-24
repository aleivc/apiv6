const express = require('express');
const download = express.Router();

const folderPath = __dirname + '/../files'
download.get('/single', (req, res, next) => {
    res.download(folderPath + '/test.txt', (err) => {
        if(err) console.log(err)
    })
})
module.exports = download
