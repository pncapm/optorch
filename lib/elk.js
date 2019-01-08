const elasticsearch = require('elasticsearch');
module.exports  = new elasticsearch.Client( {hosts: [global.elkDB],log: 'error',ssl: {rejectUnauthorized: false}});

