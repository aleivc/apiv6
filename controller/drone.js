const express = require('express');

const drone = express.Router();

const multer = require('multer')

const upload = multer()

drone.post(
    '/selectalldrones',
    // upload.none(),
    (req, res, next) => {
        console.log(req.body, req.query, req.params)
    })

module.exports = drone
