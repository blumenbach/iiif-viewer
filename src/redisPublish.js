var Emitter = require('node-redis-events');

var emitter = new Emitter({
    namespace: 'App',
    hostname: 'localhost'
});

emitter.emit('data', 'http://localhost:8081/restxq/werke/00006');

//publisher.publish("test", "http://localhost:8081/restxq/werke/00342");
//publisher.publish("test", "http://localhost:8081/restxq/werke/00006");