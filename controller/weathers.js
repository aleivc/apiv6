const express = require('express')
const xlsx = require('xlsx')
const moment = require('moment')
// const xlsx = require('node-xlsx');
const fs = require('fs')

const weathers = express.Router()

// category
const cates = [
    [
        {
            label: "温度",
            value: 'comp1.Air.T(温度)'
        },
        {
            label: "设置",
            value: 'comp1.Setpoints.SpHeat'
        }
    ],
    {
        label: '相对湿度',
        value: "comp1.Air.RH(相对湿度)"
    },
    {
        label: "CO2浓度",
        value: "comp1.Air.ppm(CO2浓度)"
    },
    {
        label: "光照强度",
        value: "common.Iglob.Value(光照强度)"
    },
    {
        label: "叶面积指数",
        value: "comp1.LAI.Value(叶面积指数)"
    },
    {
        label: "累计干重果实",
        value: "comp1.Harvest.CumFruitDW(累计干重果实)"
    },
    {
        label: "累计湿重",
        value: "comp1.comp1.Harvest.CumFruitFW(累计湿重)"
    },
    {
        label: "累计果实数量",
        value: "comp1.Harvest.CumFruitCount(累计果实数量)"
    },
    {
        label: "加热天然气使用",
        value: "common.ConBoiler.GasUse(加热天然气使用)"
    },
    {
        label: "天然气使用",
        value: "GasUse(天然气使用)"
    }
]

weathers.get('/all', async (req, res, next) => {
    const workbook = xlsx.readFile(`${__dirname}/test.xlsx`, {cellDates: true})
    let workbook_sheet = workbook.SheetNames;
    let workbook_response = xlsx.utils.sheet_to_json(
        workbook.Sheets[workbook_sheet[0]]
    );

    // do not need first line, it is table head.
    workbook_response.shift();

    const arr = []

    workbook_response.forEach(item => {
        const key = Object.keys(item);
        const val = Object.values(item);
        for (let i = 0; i <= key.length; i++) {
            if (key[i] === 'Date') continue;
            if (key[i] === 'Hourly time') continue;
            const date = moment(item['Hourly time'], 'YYYY-MM-DDTHH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
            arr.push({
                year: date,
                category: key[i],
                value: val[i],
                timestamp: moment(date).valueOf()
            })
        }
    })

    function sortData(dataArr) {
        for (let i of dataArr) {
            if (Array.isArray(i)) {
                sortData(i)
            }

            // others
            const result = arr.filter(x => x.category === i.value);
            fs.writeFile(`./files/${i.label}.json`, JSON.stringify(result), 'utf-8', (err) => {
                console.log(err)
            })
        }
    }

    sortData(cates)

    // category of move forward
    // const cateResult1 = arr.filter(x => cate1.includes(x.category));
    // fs.writeFile('./files/weathers_cate1.json', JSON.stringify(cateResult1), 'utf-8', (err) => {
    //     console.log(err)
    // })

    res.status(200).send({
        message: 'done',
    });
})

module.exports = weathers;
