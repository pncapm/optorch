// variables that can be set
var ver = "0.3";
var elkDB = 'https://optorch.com:9201';
// internal variables that should be left alone

var macaddr;
var xip;
var nodemesh = [];
const elasticsearch = require('elasticsearch');
const nic = require('getmac');
var nodename = require('os').hostname();
const ip = require('quick-local-ip').getLocalIP4();
const publicIP = require('public-ip');

//interal functions/setup
const client = new elasticsearch.Client( {
    hosts: [        
     elkDB
    ],
    log: 'error',
    ssl: {rejectUnauthorized: false}
});
function getMac(){
    return new Promise(function(resolve, reject){
        nic.getMac(function(err,macAddress){
            macaddr = macAddress.replace(/:/g,'-');
            console.log("[x] Loaded MAC address: " + macaddr);
            resolve(macaddr);
        });
    });
}
function getpublicIP(){
    return new Promise(function(resolve,reject){
        var a = publicIP.v4();
        resolve(a);
    }).catch(function(err){
        console.warn("[.] Failed to get external IP.  Fireball blocking?  Used 0 for External IP.");
        return(0);
    });
}
function CheckELK(){
    return new Promise(function(resolve,reject){
        client.ping({
            requestTimeout: 3000 // use 3s timeout for ELK
        }, function (error) {
            if (error) {
            console.error("[!] ELK cluster cannot be reached at: " + elkDB + ".  Bailing out.");
            process.exit(1);
            } else {
            console.log("[x] Confirmed ELK cluster can be reached at: " + elkDB + ".");
            resolve();
            }
        });
    });
}
//main loop
async function Main(){
    console.log("[x] Starting Operation Torch " + ver + " on " + Date());
    console.log("[x] Loaded nodename: " + nodename);
    console.log("[x] Loaded internal IP: " + ip);
    xip = await getpublicIP(); console.log("[x] Loaded External IP: " + xip);
    macaddr = await getMac();
    await CheckELK();
    await UpdateSensorNode();
    console.log('done');
}

function UpdateMesh(){
    // Connect to cluster and return all nodes
    return new Promise(function(resolve,reject){
        client.search({
            index: 'sensor_grid',
            type: 'sensor_node'
        }).then(function(resp){
            var results = resp.hits.hits;
            results.forEach(function(resp){
                console.log(resp._source);
            })
        });
    });
}
function UpdateSensorNode() {
    return new Promise(function(resolve,reject){
        client.search({
            index: 'sensor_grid',
            type: 'sensor_node',
            q: 'SensorMac: ' + macaddr
        }).then(function(resp) {
            var results = resp.hits.hits;
            var elkID;
            (results).forEach(function(result){
                elkID = result._id;
            });
            if(elkID){
                //ID exists to an update
                console.log("[ ] Checking in with ELK cluster as sensor node ID: '" + elkID + "'");
                client.index({
                    index: 'sensor_grid',
                    type: 'sensor_node',
                    id: elkID,
                    body: {
                        "SensorName" : nodename,
                        "SensorMac" : macaddr,
                        "iIP" : ip,
                        "xIP" : xip,
                        "timestamp" : new Date().getTime()  
                    }
                });
            } else {
                //This is a new node or node was deleted.  Create a new instance
                console.log("[x] CREATING new entry for this sensor node.");
                client.index({
                    index: 'sensor_grid',
                    type: 'sensor_node',
                    body: {
                        "SensorName": nodename,
                        "SensorMac": macaddr,
                        "iIP": ip,
                        "xIP": xip,
                        "timestamp": new Date().getTime()
                    }
                });
            }
            resolve();
        }, function(err) {
            console.trace(err.message);
        });
    });
}
//Main();
UpdateMesh();
//var iUpdateSensorGrid = setInterval(UpdateSensorNode, 1000);
//UpdateSensorNode();