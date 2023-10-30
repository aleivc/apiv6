const express = require('express');
const axios = require('axios');
const moment = require("moment");
const xlsx = require("node-xlsx");
const fs = require("fs");

const gps = express.Router();

gps.get('/getGpsData', async (req, res) => {
    const {deviceName = '', date = ''} = req.query;
    console.log(deviceName, date);
    res.send(await getResult(deviceName, date))
})

async function getResult(deviceName, date) {
    return await axios
        .get(`http://101.132.195.53/tools/gps_data.php?dbChange=false&page=1&device_name=${deviceName}&start=&end=${date}`)
        .then(async res => {
            if (res.data.length === 0) {
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

gps.get('/getAllPosition', async (req, res) => {
    const devices = getDeviceNames(6000, 6500);
    console.log(devices);
    res.send(await getAllGpsPosition(devices));
})

/**
 * 1 ~ 6000 (暂时显示这么多设备)
 * @returns {Promise<*[]>}
 */
let flag = [['device', 'satellite', 'time', 'lgd', 'ltd', 'xa', 'ya', 'vol', 'acc', 'timer']];
async function getAllGpsPosition(device) {
    const start = moment('2023/10/01').format('YYYY-MM-DDTHH:mm')
    const end = moment().format('YYYY-MM-DDTHH:mm:ss')
    // for (let k of devices) {
        for(let i = 21; i <= 32; i++) {
        // http://101.132.195.53/tools/gps_data.php?dbChange=false&page=1&device_name=102005998&start=2023-10-01T15%3A22&end=2023-10-30T15%3A22%3A00
        await axios
            .get(`http://101.132.195.53/tools/gps_data.php?dbChange=false&page=${i}&device_name=${device}&start=${start}&end=${end}`)
            .then(async res => {
                if (res && res.data && res.data.length) {
                    for (let i of res.data) {
                        if (i.gps_data) {
                            await axios
                                .get(`http://101.132.195.53/tools/gps_data.php?id=${i.id}&device_name=${device}`)
                                .then(resp => {
                                    if (resp && resp.data && resp.data.length) {
                                        const result = JSON.parse(resp.data);
                                        for (let j of result.reverse()) {
                                            const {time, lgd, ltd} = j
                                            // if(lgd !== 0 && ltd !== 0) {
                                            //     flag.push({id: i.id, deviceName: k, time: moment(time).format('YYYY-MM-DD HH:mm:ss'), lgd, ltd});
                                            flag.push([...Object.values(j), moment(time).format('YYYY-MM-DD HH:mm:ss')])
                                            console.log('done of ', device);
                                            // break;
                                            // }
                                        }
                                    }
                                })
                            await new Promise((resolve) => setTimeout(resolve, 1000))
                            // break;
                        }
                    }
                } else {
                    console.log('no more data')
                }
            })
    }
}

getAllGpsPosition('102005998').then(async () => {
    const sheetOptions = {
        "!cols": [{wch: 10}, {wch: 10},{wch: 10}, {wch: 10}, {wch: 10}],
    };
    const worksheets = [{name: `sheet1`, data: flag, options: sheetOptions}];
    const buffer = xlsx.build(worksheets); // Returns a buffer
    await fs.writeFileSync(`./dist/3.xlsx`, buffer);
    console.log('completed!')
})

function getDeviceNames(start, end) {
    let i = start;
    let str = '';
    const arr = [];
    while (i <= end) {
        let j = '';
        if (i < 10) {
            j = '000' + i;
        } else if (i < 100) {
            j = '00' + i
        } else if (i < 1000) {
            j = '0' + i
        } else {
            j = i.toString();
        }
        str = `10200${j}`;
        arr.push(str);
        i++;
    }
    return arr;
}

module.exports = gps;
