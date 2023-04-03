const express = require('express');
const axios = require('axios');
const moment = require("moment");

const gps = express.Router();

gps.get('/getGpsData', async (req, res) => {
    const {deviceName = '', date = ''} = req.query;
    res.send(await getResult(deviceName, date))
})

async function getResult(deviceName, date) {
    return await axios
        .get(`http://101.132.195.53/tools/gps_data.php?dbChange=false&page=1&device_name=${deviceName}&start=&end=${date}`)
        .then(async res => {
            if(res.data.length == 0) {
                return [];
            }

            let flag = [];
            for (let i of res.data) {
                await axios
                    .get(`http://101.132.195.53/tools/gps_data.php?id=${i.id}&device_name=${deviceName}`)
                    .then(resp => {
                        if (resp.data !== null) {
                            const result = JSON.parse(resp.data);
                            for (let j of result.reverse()) {
                                flag.push({...j, time: moment(j.time).format('YYYY-MM-DD HH:mm:ss')});
                            }
                        }
                    })
            }
            return flag;
        })
}

module.exports = gps;