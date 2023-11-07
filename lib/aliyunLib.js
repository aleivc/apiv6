const Iot20180120 = require("@alicloud/iot20180120");
const $OpenApi = require("@alicloud/openapi-client");
const $Util = require("@alicloud/tea-util");
const path = require("path");

require("dotenv").config({path: path.resolve(__dirname, "../.env")});

const accessKeyId = process.env.AccessKeyId;
const accessKeySecret = process.env.AccessKeySecret;
const endpoint = process.env.Endpoint;

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

let runtime = new $Util.RuntimeOptions({});

async function getDevicePropertyData(params) {
    let queryDevicePropertyDataRequest =
        new Iot20180120.QueryDevicePropertyDataRequest({
            iotInstanceId: "iot-cn-6ja1tjyb005",
            pageSize: 100,
            asc: 0,
            ...params
        });

    return client.queryDevicePropertyDataWithOptions(
        queryDevicePropertyDataRequest,
        runtime
    );
}

async function getDevicePropertyStatus(params) {
    let queryDevicePropertyStatusRequest =
        new Iot20180120.QueryDevicePropertyStatusRequest({
            iotInstanceId: "iot-cn-6ja1tjyb005",
            pageSize: 100,
            asc: 0,
            ...params
        });

    return client.queryDevicePropertyStatusWithOptions(
        queryDevicePropertyStatusRequest,
        runtime
    );
}

module.exports = {getDevicePropertyData, getDevicePropertyStatus};
