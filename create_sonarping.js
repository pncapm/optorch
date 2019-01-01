const elasticsearch = require('elasticsearch');

const client = new elasticsearch.Client( {
    hosts: [        
     'https://optorch.com:9201'
    ],
    log: 'trace',
    ssl: {rejectUnauthorized: false}
});

var indexName = "sonar_ping";

// client.indices.create({
//     index: indexName
// });

// client.indices.putMapping({
//     index: indexName,
//     type: "ping_result",
//     body: {
//         properties:{
//             Location: {type:"text"},
//             fromMAC: {type:"text"},
//             toMAC: {type:"text"},
//             Success: {type:"boolean"},
//             response_time: {type:"short"},
//             timestamp: {type:"date"}
//         }
//     }
// });

client.index({
    index: 'sonar_ping',
    type: 'ping_result',
    body: {
        Location: "bob",
        fromMAC: "tim",
        timestamp: new Date().getTime()
    }
});