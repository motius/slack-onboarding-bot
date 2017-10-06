const ws = require('nodejs-websocket');
const logger = require("winston").loggers.get('socket');

let server;
function createServer(PORT) {
    server = ws.createServer(function (conn) {
        logger.info("New connection");
        conn.on("text", function (str) {
            logger.debug("Received " + str);
            conn.sendText(str.toUpperCase() + "!!!")
        });
        conn.on("close", function (code, reason) {
            logger.info("Connection closed")
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

