const express = require('express');
const axios = require('axios');
const moment = require("moment");
const gps = express.Router();

gps.get('/query', async (req, res, next) => {
    const {deviceName, startTime, endTime} = req.query;
    const timeFormat = 'YYYY-MM-DD HH:mm:ss'
    async function getAllData() {
        let total = [];
        let pageIndex = 1;

        async function getAndStore(page) {
            const {data} = await axios.get(`http://101.132.195.53/tools/gps_data.php?dbChange=false&page=${page}&device_name=${deviceName}&start=${startTime}&end=${endTime}`)

            if (data && data.length) {
                for (let i of data) {
                    await axios
                        .get(`http://101.132.195.53/tools/gps_data.php?id=${i.id}&device_name=${deviceName}`)
                        .then(async resp => {
                            if (resp.data && resp.data !== 'null') {
                                const result = JSON.parse(resp.data).reverse();

                                for (let j of result) {
                                    const {time, lgd, ltd} = j
                                    if (lgd !== 0 && ltd !== 0) {
                                        // total.push([lgd, ltd, time])

                                        const t = moment(j.time, 'x').format(timeFormat)
                                        Object.values(j).concat(t);
                                        console.log(`done of ${deviceName} at ${t}`);
                                        pageIndex++;
                                        await getAndStore(pageIndex)
                                    }
                                }
                            }
                        })
                }
            }
        }

        await getAndStore(pageIndex);
        return total
    }

    await getAllData().then(resp => {
        // todo log
        res.status(200).send({
            success: true,
            data: resp,
            errorMessage: ""
        })
    })
})

module.exports = gps;
