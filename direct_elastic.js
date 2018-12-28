const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client( {
    hosts: [        
     'https://optorch.com:9201'
    ],
    log: 'error',
    ssl: {rejectUnauthorized: false}
});

client.indices.create({
    index: 'sensor_grid'
});