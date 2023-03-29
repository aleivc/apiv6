const express = require('express');
const axios = require('axios');
const moment = require('moment');
const md5 = require('js-md5');
// const xlsx = require('node-xlsx');
// const fs = require('fs');

async function getDate(deviceName, simNum) {
    const P_AgentID = process.env.P_AgentID;
    const P_CheckCode = process.env.P_CheckCode;
    const P_PostKey = md5(`${P_AgentID}${P_CheckCode}${moment(new Date()).format('YYYY-MM-DD&HH')}`);
    const P_CardNo = simNum.toString().substr(-10);

    return await axios
        .get('http://api.715001.com/index.php/Card/getflow', {
            params: {
                P_AgentID,
                P_CheckCode,
                P_PostKey,
                P_CardNo,
                P_Result_URL: '',
            },
        })
        .then(async ({data}) => {
            if (data.num === 4) {
                const tKey = moment(new Date()).format('YYYYMMDDHHmmss');

                const payload = {
                    userName: process.env.USER_NAME,
                    passWord: md5(md5(process.env.PASS_WORD) + tKey),
                    tKey,
                    iccid: simNum,
                };

                // eslint-disable-next-line @typescript-eslint/no-shadow
                return axios
                    .post('https://api.tibiot.cn/api/v1/card/queryCardInfo', payload)
                    .then((res) => {
                        const date = res.data.data ? res.data.data.packageTime : '-该卡不存在-';
                        return {date, supplier: '齐犇'};
                    });
            }
            const date = data.info.end_time || '---';
            return {date, supplier: '超巨'};
        });
}

async function getSingle(deviceName) {
    const time = moment(new Date()).format('YYYY-MM-DDTHH:mm:ss');
    return await axios
        .get(`http://101.132.195.53/tools/data/sim.php?page=1&device_name=${deviceName}&start=&end=${time}`)
        .then(async ({data}) => {
            const arr = {}
            for (let i = 0; i < data.length; i++) {
                const simNum = data[i]['gps_data'].match(/"sim"\s*:\s*([^,\}\]]+)/);

                if (simNum && simNum[1] && !(simNum[1].startsWith('-48'))) {
                    const endTime = await getDate(deviceName, simNum[1]);

                    // arr.push(deviceName, simNum[1], endTime["date"], endTime['supplier'])
                    arr.deviceName = deviceName;
                    arr.simNum = simNum[1];
                    arr.endTime = endTime['date'];
                    arr.supplier = endTime['supplier'];
                    break;
                }
            }
            console.log(deviceName);
            return arr.hasOwnProperty('deviceName') ? arr : {deviceName, simNum: '', endTime: '', supplier: ''}
        });
}

const sim = express.Router();

sim.get('/getSimInfo', async (req, res) => {
    res.send(await getResult());
})

const deviceName = `102001198 
102001256 
102001282 
102001284 
102001330`;

const devices = deviceName.replaceAll('  ', ' ').split(' \n');

async function getResult() {
    const arr = [];
    for (let i of devices) {
        const res = await getSingle(i)
        arr.push(res);
    }
    return arr;
    // const sheetOptions = {'!cols': [{wch: 20}, {wch: 30}, {wch: 30}, {wch: 30}]};
    // const worksheets = [{name: `sheet1`, data: arr, options: sheetOptions}];
    // const buffer = xlsx.build(worksheets); // Returns a buffer
    // await fs.writeFileSync(`./output.xlsx`, buffer);
}

module.exports = sim;