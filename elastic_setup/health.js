global.elkDB = 'https://optorch.com:9201'; 
const client = require('../lib/elk.js')
client.cluster.health({},function(err,resp,status) {  
    console.log("-- Client Health --",resp);
  });