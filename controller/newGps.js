const mysql = require("mysql");
const xlsx = require("node-xlsx");
const fs = require('fs');
const moment = require("moment")
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const {
    TRACK_HOST,
    TRACK_USER,
    TRACK_PASS,
    TRACK_DATABASE,
} = process.env;
// MySQL connection configuration
const connection = mysql.createConnection({
    host: TRACK_HOST,
    user: TRACK_USER,
    password: TRACK_PASS,
    database: TRACK_DATABASE
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);

    const device_name = '102005993';
    const year = '2023';
    const startDay = '10-22';
    const endDay = '11-23';
    const timeFormat = 'YYYY-MM-DD HH:mm:ss'
    const startTimestamp = moment(`${year}-${startDay} 00:00:00`, timeFormat).valueOf();
    const endTimestamp = moment(`${year}-${endDay} 00:00:00`, timeFormat).valueOf();

    // original sql statement
    // create_time >= (UNIX_TIMESTAMP('2023-07-22') * 1000) AND
    // create_time < (UNIX_TIMESTAMP('2023-11-23') * 1000)

    connection.query(
        `
        SELECT id,create_time,device_name,gps_data,update_time 
        FROM iot_work_track_record.iot_device_gps
        WHERE 
            device_name = ${device_name} AND
            gps_data IS NOT NULL AND
            create_time >= ${startTimestamp} AND
            create_time < ${endTimestamp}
        ORDER BY create_time DESC
        `,
        async (error, results) => {
            if (error) throw error;

            const sheet = []
            const cols = {
                "device": 102005977,
                "satellite": 29,
                "time": 1698979182000,
                "lgd": 115.2029141,
                "ltd": 33.6947351,
                "xa": 0,
                "ya": 0,
                "vol": 13.37,
                "acc": 996
            }

            sheet.push(Object.keys(cols).concat('timer'))

            results.forEach((row) => {
                const jsonData = JSON.parse(row.gps_data);

                jsonData.forEach((obj) => {
                    sheet.push(Object.values(obj).concat(moment(obj.time, 'x').format(timeFormat)))
                });
            });

            const sheetOptions = {
                "!cols": [
                    Object.keys(cols).map(c => ({ wch: 30 }))
                ],
            };

            const sheetName = `${device_name}_${year}_${startDay}-${endDay}`;

            const worksheets = [{ name: sheetName, data: sheet, options: sheetOptions }];
            const buffer = xlsx.build(worksheets);
            await fs.writeFileSync(`./files/${sheetName}.xlsx`, buffer);

            connection.end((err) => {
                if (err) {
                    console.error('Error closing MySQL connection: ' + err.stack);
                    return;
                }
                console.log('MySQL connection closed.');
            });
        });
});
