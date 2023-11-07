const express = require('express');

const {getDataFromString, getFieldFromString} = require('../lib/loraLib')
const {getDevicePropertyStatus, getDevicePropertyData} = require('../lib/aliyunLib')

const sluice = express.Router();

sluice.get('/latest', async (req, res) => {
    const {deviceName, deviceType} = req.query;

    try {
        const models = await getDevicePropertyStatus({productKey: 'g0pbWa8S5xf', deviceName: 'Sluice02'})
        const info = models.body.data.list.propertyStatusInfo
        const {value, time} = info.find(item => item.identifier === 'Sensor');
        const result = getDataFromString(value)
        res.send({
            success: true,
            data: {receipt: info, sensor: result, time},
            errorMessage: ''
        })
    } catch (e) {
        res.send({
            success: false,
            data: [],
            errorMessage: e.code
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

sluice.get('/specific', async (req, res) => {
    try {
        const {startTime, endTime, index, property, deviceType, key} = req.query;

        let result = []
        const data = await getAllData({startTime, endTime, productKey: 'g0pbWa8S5xf', deviceName: 'Sluice02', identifier: 'Sensor'});
        if(data.length > 0) {
            result = getFieldFromString(data, index, property, deviceType, key)
        }
        res.send({
            success: true,
            data: result,
            errorMessage: ''
        })
    } catch (e) {
        res.send({
            success: false,
            data: [],
            errorMessage: e.code
        })
    }
})

module.exports = sluice;
