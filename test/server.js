const mysql = require('mysql');
// Connect to the MySQL database
const connection = mysql.createConnection({
    host: 'aleivc.com',
    user: 'root',
    password: 'Aaaa1111',
    database: 'mydatabase'
});

// Set up a websocket server
const WebSocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer((request, response) => {
    // Process HTTP requests if necessary
});

server.listen(8080, () => {
    console.log('Websocket server started');
});

const wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: true
});

// Listen for changes to the notifications table
let lastId = 0;

setInterval(() => {
    const query = connection.query('SELECT * FROM notifications WHERE id > ?', [lastId]);
    query.on('result', (row) => {
        lastId = row.id;
        // Send the notification to all connected clients
        wsServer.connections.forEach((connection) => {
            connection.sendUTF(JSON.stringify({ message: row.message }));
        });
    });
}, 1000);
