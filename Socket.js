const ws = require('nodejs-websocket');

let server;
function createServer(PORT) {
    server = ws.createServer(function (conn) {
        console.log("New connection");
        conn.on("text", function (str) {
            console.log("Received " + str);
            conn.sendText(str.toUpperCase() + "!!!")
        });
        conn.on("close", function (code, reason) {
            console.log("Connection closed")
        });
    }).listen(PORT);
}

function sendCommand(msg) {
    server.connections.forEach(function (conn) {
        conn.sendText(msg)
    })
}

module.exports = {
    createServer: createServer,
    sendCommand: sendCommand,
};

