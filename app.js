// variables that can be set
const ver = "0.3";
const elkDB = 'https://optorch.com:9201';
const ping_internal = 5; // how long between pings in seconds
const updatemesh_interval = 120 // how long between getting new mesh data in seconds

// internal variables that should be left alone
var macaddr;
var xip;
var nodemesh = [];
var location;
//const tcpping = require("tcp-ping");
const ping = require ("ping");
const elasticsearch = require('elasticsearch');
const nic = require('getmac');
const nodename = require('os').hostname();
const ip = require('quick-local-ip').getLocalIP4();
const publicIP = require('public-ip');
const iplocation = require("iplocation").default;

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
function getLocation(){
    return iplocation(xip, ["https://ipinfo.io/*"])
    .then((result)=> {
        location = result;
        console.log("[x] Loaded GEO: " + location.latitude + "/" + location.longitude);
        if (!location.latitude || !location.longitude){
            throw ("Process ran, but no latitude or longitude was returned");
        };
        return(location);
    })
    .catch(err => {
        console.log("[!] Could not get Location, so using 0/0 (" + err + ")");
        var location = {latitude:0,longitude:0};
        return(location);
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
    location = await getLocation();
    await CheckELK();
    await UpdateSensorNode();
    await UpdateMesh();
    var tUpdateMesh = setInterval(UpdateMesh, updatemesh_interval * 1000);console.log("[ ] Starting Mesh Update loop.  " + updatemesh_interval + " seconds between each check in with cluster.");
    var tSonarPing = setInterval(SonarPing, ping_internal * 1000);console.log("[ ] Starting Sonar Ping loop.  Running " + nodemesh.length + " test(s) every " + ping_internal + " seconds.");
    //SonarPing();
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
        nodemesh.forEach(function(node){
            ping.promise.probe(node.IP, { timeout: 3})
            //ping.promise.probe('196.168.10.1', { timeout: 3})
            .then(function(result) {
                //console.log("from: " + ip + " MAC: " + macaddr + " to: " + node.IP + " " + node.MAC + " took: " + result.time + " ms.");
                if (result.alive){
                    // response time valid, adjust to integer for storage
                    var response_time = (result.time).toFixed(0);
                } else {
                    // could not ping, so must force response time to integer for storage
                    var response_time = 0;
                }
                client.index({
                    index: 'sonar_ping',
                    type: 'ping_result',
                    body: {
                        Location: xip,
                        fromMAC: macaddr,
                        toMAC: node.MAC,
                        Local : node.local,
                        Success: result.alive,
                        response_time: response_time,
                        timestamp: new Date().getTime()
                    }
                });
        });

        });
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
                if(resp._source.SensorMac != macaddr){
                    if(xip == resp._source.xIP){
                        var location = resp._source.iIP;
                        var local = true;
                    } else {
                        var location = resp._source.xIP;
                        var local = false;
                    }
                    nodemesh.push({
                        "IP": location,
                        "MAC": resp._source.SensorMac,
                        "local": local
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
                        "timestamp" : new Date().getTime(),
                        "location": {"lat": location.latitude, "lon": location.longitude},
                        "latitude": location.latitude,
                        "longitude": location.longitude
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
                        "timestamp": new Date().getTime(),
                        "location": {"lat": location.lat, "lon": location.lon},
                        "latitude": location.latitude,
                        "longitude": location.longitude
                    }
                });
            }
            resolve();
        }, function(err) {
            console.trace(err.message);
        });
    });
}

// Kick it off
Main();