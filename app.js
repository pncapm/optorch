//settings
const tping = './config/ping.init';

//require
const fs = require('fs');
const ping = require('ping');
const elasticsearch = require('elasticsearch');

//internal
var pinglist = [];
const client = new elasticsearch.Client( {
    hosts: [        
     'https://optorch.com:9201'
    ],
    log: 'error',
    ssl: {rejectUnauthorized: false}
});

//functions
function UpdatePingList(){
    fs.readFile(tping, 'utf8', function(err, contents){
        pinglist.length = 0;
        pinglist = (contents).split('\r\n');
        console.log("results from UpdatePingList " + pinglist);
    });
};
//var iUpdatePingList = setInterval(UpdatePingList, 5000);

function UpdateSensorGrid(){
    console.log('hello');
    client.search({
        index: 'sensor_grid'
    }).then(function(resp) {
        (resp.hits.hits).forEach(function(bug){
            console.log(bug._id);
        });
        //console.log(resp.hits.hits);
    }, function(err) {
        console.trace(err.message);
    });
}
var iUpdateSensorGrid = setInterval(UpdateSensorGrid, 1000);

function DoPing(){
    console.log("running DoPing" + pinglist);
    pinglist.forEach(function(host){
            ping.sys.probe(host, function(active){
                var info = active ? 'IP ' + host + ' = Active' : 'IP ' + host + ' = DOWN';
                console.log (info);
            });
    });
}
//var iDoPing = setInterval(DoPing, 1000);