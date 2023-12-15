const moment = require('moment')
// const string = '5AA5898604461020400187440000002E000268000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000042C00110000000000000000000000007487';

const format = [
    {len: 4, desc: '帧起始符'},
    {len: 20, desc: 'SIM 卡号'},
    {len: 8, desc: '流水号'},
    {len: 2, desc: '数据类型'},
    {len: 4, desc: '数据长度'},
    // 4个字符， 13个一组， 一共20组, 原始16进制
    {
        len: 4, num: 13, total: 20, desc: '土壤传感器', type: 0,
        detail: [
            '电池电压',
            '环境温度1', 'PCB温度1', '含水量1', 'EC值1',
            '环境温度2', 'PCB温度2', '含水量2', 'EC值2',
            '环境温度3', 'PCB温度3', '含水量3', 'EC值3',
        ],
        transform: 16
    },
    {len: 4, num: 2, total: 20, desc: '水阀传感器', type: 1,
        detail: ['电池电压', '水阀状态值'],
        transform: 16
    },
    {len: 4, num: 2, total: 4, desc: '液位传感器', type: 2,
        detail: ['电池电压', '液位高度值'],
        transform: 16
    },
    {len: 4, desc: 'CRC 校验'}
];

function hex2int(hex) {
    let len = hex.length, a = new Array(len), code;
    for (let i = 0; i < len; i++) {
        code = hex.charCodeAt(i);
        if (48<=code && code < 58) {
            code -= 48;
        } else {
            code = (code & 0xdf) - 65 + 10;
        }
        a[i] = code;
    }
    // to capture what you got. to type some book for type speed and english. make book or document for it. to find basic

    return a.reduce(function(acc, c) {
        acc = 16 * acc + c;
        return acc;
    }, 0);
}

function getDataFromString(str) {
    let result = []
    let start = 0;

    for (let i = 0; i < format.length; i++) {
        let end = format[i].len

        if (format[i].total) {
            let totalArr = []
            for (let j = 0; j < format[i].total; j++) {
                if (format[i].num) {
                    let numArr = {};
                    for (let k = 0; k < format[i].num; k++) {
                        // ugly code, CH_Hanzi as key, maybe prevent bit problem...
                        numArr[format[i]['detail'][k]] = format[i]['transform'] ? hex2int(str.substr(start, end)) : str.substr(start, end)
                        start += format[i].len
                    }

                    totalArr.push({...numArr, key: start, index: j + 1})
                }
            }

            result.push({
                type: format[i].type,
                title: format[i].desc,
                value: totalArr,
            })
        } else {
            result.push({
                title: format[i].desc,
                value: str.substr(start, end)
            })
            start += format[i].len
        }
    }

    return result
}

function getFieldFromString(arr, index, property, deviceType, key) {
    let result = []
    for(let obj of arr) {
        const data = getDataFromString(obj.value);

        // +deviceType: convert to string in javascript.
        const [{value}] = data.filter(item => item.type === +deviceType)
        const baby = value.find(item => item.key === +key)
        const time = moment(+obj.time, 'x').format('YYYY-MM-DD HH:mm:ss')
        result.push({time, title: property, value: baby[property], key: time})
    }
    return result
}

module.exports = {getDataFromString, getFieldFromString}
