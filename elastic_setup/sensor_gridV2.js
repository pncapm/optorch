global.elkDB = 'https://optorch.com:9201';
const indexname = 'sensor_gridv2';

var client = require('../lib/elk.js');

var kill = function (){
    console.log("Delete " + indexname);
    client.indices.delete({
        index: indexname
    }).then(function (resp){
        console.log(resp);
    }, function (error){
        console.log(error);
    }).then(create);
}
var create = function (){
    console.log("Create new " + indexname);
    client.indices.create({
        index: indexname
    }).then(function (resp){
        console.log(resp);
    }, function (error){
        console.log(error);
    }).then(map);
}
var map = function (){
console.log("Create mapping");
client.indices.putMapping({
    index: indexname,
    type: "node",
    body:{
        node:{
            properties:{
                //sensor_type
                //sensor_name
                //optorch_ver
                "icmp": {type:"boolean"},
                //sensor_address
                //sensor_param
                //external_address
                "timestamp" : {type:"date"},
                "location": {type:"geo_point"},
                //"port": {type:"short"}, // (any port needed)
                //username
                //password
                //auth_type
                //payload
                //resp_code
                //resp_crit
                //sensor_mac
                "active" : {type:"boolean"}
            }
        }
    }
}).then(function (resp){
    console.log(resp);
}, function (error){
    console.log(error);
}).then(populate);
}
var populate = function (){
    console.log("Populate example data");
    var payload = '{'
    +'"sensor_type" : "example",'
    +'"sensor_name" : "'+'test_node'+'",'
    +'"optorch_ver" : "'+'X.x'+'",'
    +'"icmp" : '+'true'+','
    +'"sensor_address" : "'+'192.1.1.1'+'",'
    +'"sensor_param" : "'+'/subdomain/'+'",'
    +'"external_address" : "'+'10.1.1.1'+'",'
    +'"timestamp" : "'+new Date().getTime()+'",'
    +'"location" : {"lat" : '+'0'+', "lon" : '+'0'+'},'
    +'"port" : '+'1234'+','
    +'"username" : "'+'ted'+'",'
    +'"password" : "'+'hairypancakes'+'",'
    +'"auth_type" : "'+'SQL'+'",'
    +'"payload" : "'+'select * from happy place'+'",'
    +'"resp_code" : "'+'200|201'+'",'
    +'"resp_crit" : "'+'hello test user 1'+'",'
    +'"sensor_mac" : "'+'00-00-00-00-00-00'+'",'
    +'"active" : '+'true'
    +'}';
    client.index({
        index: indexname,
        type: 'node',
        id: 'example_only',
        body: payload
    }).then(function(resp){
        console.log(resp);
    }, function (error){
        console.log(error);
    });
}
kill()