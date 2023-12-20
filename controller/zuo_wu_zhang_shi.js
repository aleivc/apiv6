const mysql = require("mysql");
const moment = require("moment")
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const {
    REMOTE_HOST,
    REMOTE_PORT,
    REMOTE_USER,
    REMOTE_PASS,
    REMOTE_DATABASE
} = process.env;
// MySQL connection configuration
const connection = mysql.createConnection({
    host: REMOTE_HOST,
    port: REMOTE_PORT,
    user: REMOTE_USER,
    password: REMOTE_PASS,
    database: REMOTE_DATABASE
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);

    const table = ['lingang_zs' || 'lingang_zs_sg']
    const column = 'LG_1_1';

    for (let x of table) {
        const zs = `
            SELECT date,${column} FROM ${x}
            WHERE date > '2023/01/01'
            LIMIT 100 
        `;

        connection.query(zs, async (error, results) => {
            if (error) throw error;
            console.log(results);
            // written in json file
            const sheet = []

            results.forEach((row) => {
                sheet.push({date: moment(row.date).format('YYYY-MM-DD'), category: x, value: row[column]})
            });

            await fs.writeFileSync(`./${x}.json`, JSON.stringify(sheet));
            connection.end((err) => {
                if (err) {
                    console.error('Error closing MySQL connection: ' + err.stack);
                    return;
                }
                console.log('MySQL connection closed.');
            });
        });
    }
});
