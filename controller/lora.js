const express = require('express');
const Iot20180120 = require("@alicloud/iot20180120");
const $OpenApi = require("@alicloud/openapi-client");
const $Util = require("@alicloud/tea-util");
const moment = require("moment");
const path = require("path");
const {getDataFromString, getFieldFromString} = require('./loraLib')
require("dotenv").config({path: path.resolve(__dirname, "../.env")});

// 这里可以用 class 去写
const accessKeyId = process.env.AccessKeyId;
const accessKeySecret = process.env.AccessKeySecret;
const endpoint = process.env.Endpoint;
const shui = express.Router();

let config = new $OpenApi.Config({
    // 必填，您的 AccessKey ID
    accessKeyId,
    // 必填，您的 AccessKey Secret
    accessKeySecret,
    // endpoint
    endpoint,

    regionId: "cn-shanghai",
});

const client = new Iot20180120.default(config);
// const endTime = moment();

let runtime = new $Util.RuntimeOptions({});

// const params = {
//     endTime: moment('2023/10/24 16:35:49', 'YYYY/MM/DD HH:mm:ss').valueOf(),
//     startTime: moment('2023/10/24 16:34:18', 'YYYY/MM/DD HH:mm:ss').valueOf(),
//     pageSize: 100,
//     productKey: "g0pbWa8S5xf",
// };

async function getDevicePropertyData({startTime, endTime}) {
    let queryDevicePropertyDataRequest =
        new Iot20180120.QueryDevicePropertyDataRequest({
            iotInstanceId: "iot-cn-6ja1tjyb005",
            productKey: "g0pbWa8S5xf",
            deviceName: "Sluice02",
            asc: 1,
            identifier: "Sensor",
            pageSize: 100,
            // 这里只能查 1 分钟的，用 nextValid 的方式去查, 那么怎么查最新的呢?
            // 首先去调 status, 查到最近的时间,然后传到下面
            // startTime: moment('2023/10/24 18:34:18', 'YYYY/MM/DD HH:mm:ss' ).valueOf(),
            // endTime: moment('2023/10/24 17:35:49', 'YYYY/MM/DD HH:mm:ss').valueOf(),
            startTime,
            endTime,
        });

    return client.queryDevicePropertyDataWithOptions(
        queryDevicePropertyDataRequest,
        runtime
    );
}

async function getDevicePropertyStatus() {
    let queryDevicePropertyStatusRequest =
        new Iot20180120.QueryDevicePropertyStatusRequest({
            iotInstanceId: "iot-cn-6ja1tjyb005",
            productKey: 'g0pbWa8S5xf',
            deviceName: 'Sluice02',
            asc: 0,
            pageSize: 100
        });

    return client.queryDevicePropertyStatusWithOptions(
        queryDevicePropertyStatusRequest,
        runtime
    );
}


shui.get('/getLatestProperty', async (req, res) => {
    try {
        const models = await getDevicePropertyStatus()
        const info = models.body.data.list.propertyStatusInfo
        const {value, time} = info.find(item => item.identifier === 'Sensor');
        const result = getDataFromString(value)
        res.send({
            data: {sensor: result, origin: info},
            time,
            error: ''
        })
    } catch (e) {
        res.send({
            data: [],
            error: e.code
        })
    }
})


async function getAllData(p) {
    const allData = [];

    async function getAndStore(p) {
        try {
            const { body } = await getDevicePropertyData(p);
            allData.push(...body.data.list.propertyInfo);

            if (body.data.nextValid) {
                // const len = body.data.list.propertyInfo.length
                await new Promise((resolve) => setTimeout(resolve, 1000 ))
                await getAndStore({ ...p, startTime: +body.data.nextTime});
            }
        } catch (e) {
            console.log('error', e)
        }
    }

    await getAndStore(p);
    return allData;
}

shui.get('/getSpecificProperty', async (req, res) => {
    try {
        const {start, end, index, property, deviceType, key} = req.query;
        console.log(start, end, index, property, deviceType, key)

        let result = []
        const data = await getAllData({startTime: start, endTime: end});
        if(data.length > 0) {
            result = getFieldFromString(data, index, property, deviceType, key)
        }
        res.send({
            data: result,
            error: ''
        })
    } catch (e) {
        res.send({
            data: [],
            error: e.code
        })
    }
})

module.exports = shui;
