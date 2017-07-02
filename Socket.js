const io = require('socket.io');
var listener;
var socketConnected;
function startSocket(server, PORT) {
    listener = io.listen(server);
    server.listen(PORT);
    listener.on('connection', function (socket) {

        console.log('Robot connected!');
        socketConnected = socket;
        socket.on('disconnect', () => {
            const tabId = socket.id;
            console.log('Robot disconnected!');
            socket.leave(tabId);
        });

        socket.on('create-node', emitData('create-node'));

        // Take the event input and just pass the received data
        function emitData(eventName) {
            return (data) => {
                console.log(data)
                // if (data.canvasId) {
                //     const roomId = data.canvasId;
                //     socket.broadcast.to(roomId).emit(eventName, data);
                // } else if (eventName.indexOf("global-constant") !== -1) {
                //     socket.broadcast.emit(eventName, data);
                // } else {
                //     console.error("You need to pass the canvas Id!");
                //     socket.emit(eventName, "You need to pass the canvasId to the socket endpoint");
                // }
            };
        }
    });
}

function emitEvent(event) {
    try {
        console.log(event)
        socketConnected.emit(event);
    } catch (e) {
        console.log(e)
    }

}

module.exports = {
    startSocket: startSocket,
    emitEvent: emitEvent,
};
