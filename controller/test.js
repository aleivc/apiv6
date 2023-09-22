const express = require("express");

const test = express.Router();

test
    .get("/get", (req, res) => {
        console.log(req.query)
        res.send("get ok");
    })
    .post("/post", (req, res) => {
        console.log(req.body)
        res.send("post ok");
    });

module.exports = test;