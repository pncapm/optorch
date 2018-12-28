var macaddr;
var xip;
const elasticsearch = require('elasticsearch');
const nic = require('getmac');
const hostname = require('os').hostname;
const ip = require('quick-local-ip').getLocalIP4();
const getIP = require('external-ip');

getIP((err, ip) => {
    if (err) {
        console.log("Could not figure out external IP address, using 0")
        xip = 0;
    }
    console.log(ip);

});

//interal functions/setup
const client = new elasticsearch.Client( {
    hosts: [        
     'https://optorch.com:9201'
    ],
    log: 'error',
    ssl: {rejectUnauthorized: false}
});
function getMac(){
    return new Promise(function(resolve, reject){
        nic.getMac(function(err,macAddress){
            macaddr = macAddress;
            console.log("[x] Loaded MAC address: " + macaddr);
            resolve(macaddr);
        });
    });
}

//main loop
async function UpdateSensorGrid() {
    if(!macaddr){macaddr = await getMac();}
    var results;
    client.search({
        index: 'sensor_grid',
        type: 'sensor_node',
        q: 'sensorMAC:' + macaddr
    }).then(function(resp) {
        results = resp.hits.hits;
        console.log("Raw result was" + resp);
        
        (resp.hits.hits).forEach(function(bug){
            console.log(bug._id);
        });
        //console.log(resp.hits.hits);
    }, function(err) {
        console.trace(err.message);
    });
}

async function UpdateSensorNode() {
    if(!macaddr){macaddr = await getMac();}
    client.search({
        index: 'sensor_grid',
        type: 'sensor_node',
        q: 'sensorMAC:' + macaddr
    }).then(function(resp) {
        var results = resp.hits.hits;
        var idexists;
        //if (results){console.log("was a thing");}else{Console.log("EMPTY");}
        (results).forEach(function(bug){
            var idexists = bug._id;
        });
        if(idexists){
            //ID exists to an update
            console.log("it exists with ID: " + resp._id);
        } else {
            //This is a new node or node was deleted.  Create a new instance
            console.log("nopers");
            client.index({
                index: 'sensor_grid',
                type: 'sensor_node',
                body: {
                    SensorName: hostname,
                    SensorMac: macaddr,
                    iIP: ip,
                    xIP: xip,
                    timestamp: Date()
                }

            });
        }
    }, function(err) {
        console.trace(err.message);
    });
}

//var iUpdateSensorGrid = setInterval(UpdateSensorNode, 1000);
UpdateSensorNode();