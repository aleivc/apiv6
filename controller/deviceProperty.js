const Iot20180120 = require("@alicloud/iot20180120");
const $OpenApi = require("@alicloud/openapi-client");
const $Util = require("@alicloud/tea-util");

const xlsx = require("node-xlsx");
const fs = require("fs");

const path = require("path");
const moment = require("moment");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const accessKeyId = process.env.AccessKeyId;
const accessKeySecret = process.env.AccessKeySecret;
const endpoint = process.env.Endpoint;

let config = new $OpenApi.Config({
    // 必填，您的 AccessKey ID
    accessKeyId: accessKeyId,
    // 必填，您的 AccessKey Secret
    accessKeySecret: accessKeySecret,

    regionId: "cn-shanghai",
});

// 访问的域名
config.endpoint = endpoint;

const client = new Iot20180120.default(config);
const endTime = moment();

const params = {
    endTime: endTime.valueOf(),
    // startTime: endTime.subtract(1, "month").valueOf(),
    startTime: moment('2023-09-21 20:00:00').valueOf(),
    pageSize: 100,
    productKey: "g0pbS6Z9pL2",
};

let runtime = new $Util.RuntimeOptions({});

const keyTable = [
    ['Station04', 'g0pbkU6CoV7'],
    ['Station10', 'g0pbS6Z9pL2'],
]

async function getDevicePropertyData(p) {
    let queryDevicePropertyDataRequest =
        new Iot20180120.QueryDevicePropertyDataRequest({
            iotInstanceId: "iot-cn-6ja1tjyb005",
            asc: 0,
            ...p,
        });

    return client.queryDevicePropertyDataWithOptions(
        queryDevicePropertyDataRequest,
        runtime
    );
}

async function getDevicePropertyStatus(deviceName) {
    let queryDevicePropertyStatusRequest =
        new Iot20180120.QueryDevicePropertyStatusRequest({
            iotInstanceId: "iot-cn-6ja1tjyb005",
            productKey: params.productKey,
            deviceName,
        });

    return client.queryDevicePropertyStatusWithOptions(
        queryDevicePropertyStatusRequest,
        runtime
    );
}

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
            await getAndStore({ ...p, endTime: body.data.nextTime });
        }
    }

    await getAndStore(p);
    return allData;
}

async function getAllPropertyData() {
    const allData = [];
    for (const i of ["Station30"]) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await getDevicePropertyStatus(i).then(async (res) => {
            const { propertyStatusInfo } = res.body.data.list;

            for (const j of propertyStatusInfo) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                await getAllData({
                    ...params,
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
        "!cols": [{ wch: 20 }, { wch: 30 }, ...uniqueIdentifiers.map(i => ({ wch: 10 }))],
    };
    const worksheets = [{ name: `sheet1`, data: newData, options: sheetOptions }];
    const buffer = xlsx.build(worksheets); // Returns a buffer
    await fs.writeFileSync(`./${deviceName[0]}.xlsx`, buffer);
    console.log('completed!')
});
