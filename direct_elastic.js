const elasticsearch = require('elasticsearch');

const client = new elasticsearch.Client( {
    hosts: [        
     'https://optorch.com:9201'
    ],
    log: 'trace',
    ssl: {rejectUnauthorized: false}
});

var indexName = "sensor_grid";



// client.indices.create({
//     index: indexName
// });

client.indices.putMapping({
    index: indexName,
    type: "sensor_node",
    body: {
        properties:{
            SensorName: {type:"text"},
            SensorMac: {type:"text"},
            iIP: {type:"text"},
            xIP: {type:"text"},
            timestamp: {type:"date"}
        }
    }
});

// client.search({
//     index:indexName,
//     type: "sensor_node",
//     q: "SensorMac:40-"
// }).then(function(resp){
//     var results = resp.hits.hits;
//     (results).forEach(function(hit){
//         console.log(Object.keys(hit));
//     });
//     //console.log(BLAH)
// });

// client.index({
//     index: 'sensor_grid',
//     type: 'sensor_node',
//     body: {
//         SensorName: 'bob',
//         SensorMac: '00',
//         iIP: '192.168.1.50',
//         xIP: '107.10.194.56'
//         //timestamp: Date()
//     }

// });

// Delete a document

// client.delete({
//     index: 'sensor_grid',
//     type: 'sensor_node',
//     id: 'iAZM-GcBffK-wTGJCPzt'
// });
