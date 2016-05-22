var app = require('http').createServer();
var io = require('socket.io')(app);
var redis = require('socket.io-redis');
app.listen(3000);
console.log('Listening at: http://localhost:3000');

io.set('origins', 'http://localhost:4010');

io.adapter(redis({ host: '127.0.0.1', port: 6379, key: 'meta' }));

io.sockets.on('connection', function(socket) {
    socket.on('message', function(data) {
        socket.broadcast.emit('message', data);
        console.log(data);
    });
});