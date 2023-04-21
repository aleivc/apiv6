const WebSocket = require('ws');

const socket = new WebSocket('ws://localhost:8080');

socket.on('open', () => {
    console.log('Connected to server');
    // Send a message to the server after connecting
    socket.send('Hello, server!');
});

socket.on('message', (data) => {
    console.log(`Received message: ${data}`);
    // Process the message as needed
});

socket.on('close', () => {
    console.log('Connection closed');
});
