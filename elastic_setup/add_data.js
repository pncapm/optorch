global.elkDB = 'https://optorch.com:9201';
var client = require('../lib/elk.js');

const indexname = "sensor_remote";

client.index({
    index: indexname,
    type: 'sensor_node',
    body: {
        "SensorType": 'remote',
        "SensorName": 'google',
        "URL": 'www.google.com',
        "WebPort" : 80,
        "canPing" : true
    }
});