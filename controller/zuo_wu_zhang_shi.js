const mysql = require("mysql");
const moment = require("moment")
const xlsx = require("node-xlsx");
const fs = require("fs");

// MySQL connection configuration
const connection = mysql.createConnection({
    host: '172.16.2.213',
    port: 7900,
    user: 'remote_data',
    password: 'sfrjgri&99YubmIklOp',
    database: 'remote_data'
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
    const columns = ['date', 'LG_1_1']
    const zs = `
        SELECT date, LG_1_1 FROM lingang_zs
        WHERE date > '2023/01/01'
        LIMIT 100 
    `;
    const zs_sg = `
        SELECT date, LG_1_1 FROM lingang_zs_sg
        WHERE date > '2023/01/01'
        LIMIT 100  
    `

    connection.query(zs_sg, async (error, results, fields) => {
        if (error) throw error;
        console.log(results);
        // written in json file
        const sheet = []
        results.forEach((row) => {
            sheet.push({date: moment(row.date).format('YYYY-MM-DD'), category: 'LG_1_1', value: row.LG_1_1})
        });

        // const sheetOptions = {
        //     "!cols": [
        //         columns.map(c => ({ wch: 30 }))
        //     ],
        // };
        //
        const sheetName = `sheet002`;
        //
        // const worksheets = [{ name: sheetName, data: sheet, options: sheetOptions }];
        // const buffer = xlsx.build(worksheets);
        await fs.writeFileSync(`./${sheetName}.json`, JSON.stringify(sheet));
        connection.end((err) => {
            if (err) {
                console.error('Error closing MySQL connection: ' + err.stack);
                return;
            }
            console.log('MySQL connection closed.');
        });
    });
});
