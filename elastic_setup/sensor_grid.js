global.elkDB = 'https://optorch.com:9201';
const indexname = 'sensor_gridv2';

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
                type: "node",
                body:{
                    node:{
                        properties:{
                            //sensor_name
                            //Optorch_version
                            "active" : {type:"boolean"},
                            //sensor_type- grid:tcpping:ping:sql:post:ldap:dns:smtp
                            //sensor_address (IP, server name, URL)
                            //sensor_parameter (URL subdomain, etc)
                            "port": {type:"short"}, // (any port needed)
                            //payload
                            //resp_code 
                            //resp_criteria
                            "icmp": {type:"boolean"},
                            //username
                            //password
                            //xIP
                            //sensor_mac
                            "timestamp" : {type:"date"},
                            "location": {type:"geo_point"}
                        }
                    }
                }
            })
            }
        });
    });
}
//removedata();
recreate();