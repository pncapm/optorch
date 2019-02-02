global.elkDB = 'https://optorch.com:9201';
const indexname = "sensor_remote";

var client = require('../lib/elk.js');

function removedata(){
    client.delete({
        index: indexname,
        type: 'sensor_node',
        id: '_2E3TWgBEO1PdOF4'
        }).catch(function(err){
            console.log(err);
        });
}
function recreate(){
    client.indices.delete(
        {index: indexname
        },function(err,resp,status) {
            if(err){
                console.log(err);
            }
        console.log("delete",resp);
        client.indices.create({
            index: indexname
        },function(err,resp,status) {
            if(err) {
            console.log(err);
            }
            else {
            console.log("create",resp);
            client.indices.putMapping({
                index: indexname,
                type: "sensor_node",
                body:{
                    sensor_node:{
                        properties:{
                            "location": {type:"geo_point"},
                            "latitude": {type:"half_float"},
                            "longitude": {type:"half_float"}
                        }
                    }
                }
            })
            }
        });
    });
}
recreate();