const express = require('express');
const axios = require('axios');
const moment = require('moment');
const md5 = require('js-md5');

const sim = express.Router();

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
        .then(async ({ data }) => {
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
                        return { date, supplier: '齐犇' };
                    });
            } else if( data.num === 0) {
                return { date: '', supplier: 'wrong'}
            }
            const date = data.info.end_time || '---';
            return { date, supplier: '超巨' };
        });
}

async function getSims(deviceNames) {
    const time = moment(new Date()).format('YYYY-MM-DDTHH:mm:ss');
    return await axios
        .get(`http://101.132.195.53/tools/data/sim.php?page=1&device_name=${deviceNames}&start=&end=${time}`)
        .then(async ({data}) => {
            console.log(data);
            return data;
            // let arr = []
            // let i = data.length - 1;
            // while (i >= 0) {
            //     const deviceName = data[i]['device_name'];
            //     const simNum = data[i]['gps_data'].match(/"sim"\s*:\s*([^,\}\]]+)/)[1];
            //
            //     const endTime = await getDate(deviceName, simNum);
            //     arr.push({
            //         deviceName,
            //         simNum,
            //         ...endTime
            //     })
            //     i--;
            // }
            // console.log(arr);
            // return arr;
        })
}

/**
 * 1. 有的设备号查出来的卡号不对 是 48-48-48 这种格式的,此时应该去查询另一个接口?
 */
sim.get('/getSimInfo', async (req, res) => {
    const {query, startTime, endTime} = req.query;

    const {deviceNames, startIndex, endIndex} = JSON.parse(query);

    console.log(startIndex, endIndex);
    if(deviceNames) {
        // 根据设备名称查找
        if(!deviceNames.toString().trim().includes(' ')) {
            // 查找单个
        }

        // 查找多个
        getSims(deviceNames.replaceAll(' ', '%0A')).then(result => {
            return res.send({
                success: true,
                msg: 'get success',
                data: result
            })
        })
    } else if (startIndex && endIndex) {
        // 根据区间查找
        let i = parseInt(startIndex);
        let str = '';
        while (i <= parseInt(endIndex)) {
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
            str += `10200${j}%0A`;
            i++;
        }
        getSims(str.substr(0, str.length - 3)).then(result => {
            return res.send({
                success: true,
                msg: 'get success',
                data: result
            })
        })

    } else {
        return res.send({
            success: true,
            msg: 'no data',
            data: []
        })
    }


})

module.exports = sim;