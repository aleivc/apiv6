const $Iot20180120 = require("@alicloud/iot20180120");
const Iot20180120 = require("@alicloud/iot20180120");
const $OpenApi = require("@alicloud/openapi-client");
const $Util = require("@alicloud/tea-util");

const express = require("express");

const station = express.Router();

const accessKeyId = process.env.AccessKeyId;
const accessKeySecret = process.env.AccessKeySecret;

// 根据 deviceName 查询 productKey
const endpoint = process.env.Endpoint;
const iotInstanceId = process.env.IotInstanceId;

station.post("/getStationInfo", async (req, res) => {
  const result = await getStationInfo(req.body.devices);
  res.send(result.map((item) => item.value.body.data.list.propertyStatusInfo));
});

async function getStationInfo([d1,d3]) {
  let config = new $OpenApi.Config({
    // 必填，您的 AccessKey ID
    accessKeyId: accessKeyId,
    // 必填，您的 AccessKey Secret
    accessKeySecret: accessKeySecret,
  });
  // 访问的域名
  config.endpoint = endpoint;

  const client = new Iot20180120.default(config);
  let q1 = new $Iot20180120.QueryDevicePropertyStatusRequest({
    iotInstanceId,
    productKey: "g0pbkU6CoV7",
    deviceName: d1,
  });

  let q3 = new $Iot20180120.QueryDevicePropertyStatusRequest({
    iotInstanceId,
    productKey: "g0pbS6Z9pL2",
    deviceName: d3,
  });

  let runtime = new $Util.RuntimeOptions({});

  console.log(runtime);
  return await Promise.allSettled([
    client.queryDevicePropertyStatusWithOptions(q1, runtime),
    client.queryDevicePropertyStatusWithOptions(q3, runtime),
  ]);
}

module.exports = station;
