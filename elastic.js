// variables that can be set
var ver = "0.3";
var elkDB = 'https://optorch.com:9201';

// internal variables that should be left alone
var macaddr;
var xip;
var nodemesh = [];
var tcpping = require("tcp-ping");
var ping = require ("ping");
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
    await UpdateMesh();
    //var tUpdateMesh = setInterval(UpdateMesh, 10000);
    //var tSonarPing = setInterval(SonarPing,1000);
    SonarPing();
}

function SonarTCPPing(){
    if (nodemesh.length == 0){console.log("[.] SonarTCPPing was called, but there are zero nodes in the mesh.")};
    nodemesh.forEach(function(node){
        tcpping.ping({ address: node.iIP, attempts:'1'}, function(err, results){
            var info = results.results;
            info.forEach(function(answer){
                console.log(answer);
            });
            console.log (node.iIP + " " + info.avg);
        });

    })
}

function SonarPing(){
    if (nodemesh.length == 0){console.log("[.] SonarPing was called, but there are zero nodes in the mesh.")};
        //return new Promise(function(resolve, reject){
        nodemesh.forEach(function(host){
            ping.promise.probe(host.iIP)
            .then(function(result) {
                console.log("from: " + xip + " MAC: " + macaddr + " to: " + result.numeric_host + " " + host.MAC + " took: " + result.time + " ms.");
                client.index({
                    index: 'sonar_ping',
                    type: 'ping_result',
                    body: {
                        Location: xip,
                        fromMAC: macaddr,
                        toMAC: host.MAC,
                        Success: result.alive,
                        response_time: (result.time).toFixed(0),
                        timestamp: new Date().getTime()
                    }
                });
        });

        });
        //});
}

function UpdateMesh(){
    // Connect to cluster and return all nodes minus this one
    return new Promise(function(resolve,reject){
        client.search({
            index: 'sensor_grid',
            type: 'sensor_node'
        }).then(function(resp){
            nodemesh.length = 0;
            var results = resp.hits.hits;
            results.forEach(function(resp){
                //console.log("MAC from cluster " + resp._source.SensorMac + " MAC local " + macaddr);
                if(resp._source.SensorMac != macaddr){
                    nodemesh.push({
                        "SensorName": resp._source.SensorName,
                        "iIP": resp._source.iIP,
                        "MAC": resp._source.SensorMac
                    });
                }
            });
            console.log("[ ] Updated node mesh.  My total workload: " + nodemesh.length);
            resolve(nodemesh);
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
Main();

//var iUpdateSensorGrid = setInterval(UpdateSensorNode, 1000);
//UpdateSensorNode();