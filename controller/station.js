const moment = require("moment");
const xlsx = require("node-xlsx");
const fs = require("fs");

const {getDevicePropertyStatus, getDevicePropertyData} = require('./../lib/aliyunLib')

// if that key doesn't work.
const keyTable = [
    ['Station04', 'g0pbkU6CoV7'],
    ['Station10', 'g0pbS6Z9pL2'],
]

function processResult(data, attr) {
    let result = [];
    for (const info of data.list[attr]) {
        info.time
            ? result.push({
                ...info,
                time: moment(parseInt(info.time)).format("YYYY-MM-DD HH:mm:ss"),
            })
            : null;
    }
    return result;
}

async function getAllData(p) {
    const allData = [];

    async function getAndStore(p) {
        const { body } = await getDevicePropertyData(p);
        const arr = processResult(body.data, "propertyInfo");
        allData.push(...arr);

        if (body.data.nextValid) {
            console.log(moment(body.data.nextTime, 'x').format('YYYY-MM-DD HH:mm:ss'))
            await getAndStore({ ...p, endTime: body.data.nextTime });
        }
    }

    await getAndStore(p);
    return allData;
}

async function getAllPropertyData() {
    const allData = [];
    for (const i of ["Station09"]) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await getDevicePropertyStatus({deviceName: i, productKey: 'g0pbS6Z9pL2'}).then(async (res) => {
            const { propertyStatusInfo } = res.body.data.list;

            for (const j of propertyStatusInfo) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                await getAllData({
                    // startTime: endTime.subtract(1, "month").valueOf(),
                    startTime: moment('2023-09-30 00:00:00').valueOf(),
                    // endTime: endTime.valueOf(),
                    endTime: moment('2023-11-30 23:59:59').valueOf(),
                    pageSize: 100,
                    productKey: "g0pbS6Z9pL2",
                    deviceName: i,
                    identifier: j.identifier,
                }).then(async (res) => {
                    const tableInfo = res.map((r) => ({
                        deviceName: i,
                        time: r.time,
                        modelName: j.name,
                        identifier: j.identifier,
                        value: r.value,
                    }));
                    console.log(`done with ${j.identifier}`);

                    allData.push(...tableInfo);
                });
            }
        });
    }
    return allData;
}

getAllPropertyData().then(async (res) => {
    const data = res;
    const uniqueIdentifiers = [...new Set(data.map((item) => item.identifier))];
    const newData = [["deviceName", "time", ...uniqueIdentifiers]];

    const deviceName = data.map((i) => i.deviceName);
    const time = data.map((i) => i.time);

    const valueColumns = [];

    uniqueIdentifiers.forEach((i) => {
        const d = data.filter((j) => j.identifier === i).map((i) => i.value);
        valueColumns.push([...d]);
    });

    valueColumns[0] && valueColumns[0].forEach((i, index) => {
        const temp = [deviceName[index], time[index]];
        uniqueIdentifiers.forEach((j, k) => {
            temp.push(valueColumns[k][index]);
        });
        newData.push(temp);
    });

    const sheetOptions = {
        "!cols": [{ wch: 20 }, { wch: 30 }, ...uniqueIdentifiers.map(() => ({ wch: 10 }))],
    };

    const worksheets = [{ name: `sheet1`, data: newData, options: sheetOptions }];
    const buffer = xlsx.build(worksheets); // Returns a buffer
    await fs.writeFileSync(`../files/${deviceName[0]}.xlsx`, buffer);
    console.log('completed!')
});
