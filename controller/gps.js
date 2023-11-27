const express = require('express');
const axios = require('axios');
const moment = require("moment");
const gps = express.Router();

gps.get('/query', async (req, res, next) => {
    const {deviceName, startTime, endTime} = req.query;
    const timeFormat = 'YYYY-MM-DD HH:mm:ss'

    let pageIndex = 1;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    function getData() {
        axios.get(`http://101.132.195.53/tools/gps_data.php?dbChange=false&page=${pageIndex}&device_name=${deviceName}&start=${startTime}&end=${endTime}`)
            .then(async (resp_arr) => {
                if (resp_arr.data && resp_arr.data.length) {
                    for (let i of resp_arr.data) {
                        axios
                            .get(`http://101.132.195.53/tools/gps_data.php?id=${i.id}&device_name=${deviceName}`)
                            .then(async (resp) => {
                                if (resp && resp.data !== 'null') {
                                    const json = JSON.parse(resp.data);
                                    if (json && json.length) {
                                        for (let j of json) {
                                            const {time, lgd, ltd} = j
                                            if (lgd !== 0 && ltd !== 0) {
                                                const t = moment(time, 'x').format(timeFormat)

                                                console.log(`${t} lgd: ${lgd} ltd: ${ltd}`);
                                                res.write(JSON.stringify({...j, time: t}))
                                                pageIndex++;
                                                getData();
                                            }
                                        }
                                    }
                                }
                            }).catch(error => next(error))
                    }
                } else {
                    res.end()
                }
            })
            .catch(error => {
                next(error)
            })
    }

    getData(pageIndex);
})

module.exports = gps;
