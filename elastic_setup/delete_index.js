global.elkDB = 'https://optorch.com:9201';
const indexname = "optorch_grid";
var client = require('../lib/elk.js');

function nuke(){
    client.indices.delete(
        {index: indexname},
        function(err,resp,status) {
            if(err){
                console.log(err);
            }
        console.log("delete",resp);
        }
    );
}
nuke();