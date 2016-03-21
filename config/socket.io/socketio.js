
var IO = function(io) {

    io.on('connect', function (socket) {

        console.log('Yeah socketio require works');

        socket.emit('response','hi,you connected by require');

        socket.on('testing', function(msg){
            console.log('testing message: ' + msg);
            socket.emit('response','testing recied ' + msg);
        });

    });

    return io;
};

module.exports = IO;