// variables that can be set
const ver = "0.4";
const elkDB = 'https://optorch.com:9201';
var wwwport = 9000; // port the web server should use (must be > 1024)
const ping_internal = 5; // how long between pings in seconds
const updatemesh_interval = 1 // how long between getting new mesh data in *minutes*
const UpdateSensorNode_interval = 1  // how long to wait between cluster heartbeats in *minutes*
const NodeAgeLimit = 5 //maximum age in *minutes* other nodes will be included before being ignored as dead

// internal variables that should be left alone
var macaddr;
var xip;
var nodemesh = [];
var location;

const tcpping = require("tcp-ping");
const ping = require ("ping");
const elasticsearch = require('elasticsearch');
const nic = require('getmac');
const nodename = require('os').hostname();
const ip = require('quick-local-ip').getLocalIP4();
const publicIP = require('public-ip');
const iplocation = require("iplocation").default;
const www = require('http');
const fs = require('fs');
const wwwpath = require('path');

//interal functions/setup
const client = new elasticsearch.Client( {
    hosts: [        
     elkDB
    ],
    log: 'error',
    ssl: {rejectUnauthorized: false}
});
function getMac(){
    //return this device's internal IP address
    return new Promise(function(resolve, reject){
        nic.getMac(function(err,macAddress){
            macaddr = macAddress.replace(/:/g,'-');
            console.log("[x] Loaded MAC address: " + macaddr);
            resolve(macaddr);
        });
    });
}
function getpublicIP(){
    //return this device's external IP address.
    return new Promise(function(resolve,reject){
        var a = publicIP.v4();
        resolve(a);
    }).catch(function(err){
        console.warn("[.] Failed to get external IP.  Fireball blocking?  Used 0 for External IP.");
        return(0);
    });
}
function getLocation(){
    //Pull basic geographic information based on external IP
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
    //Ping the ELK cluster to ensure this device will be able to communicate with home base
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
function startWebServer(){
    //startup a simple webserver for TCP pings and file downloads
    return new Promise(function(resolve, reject){
        www.createServer(function (req, res){
            var filePath = './www' + req.url;
            if (filePath == './www/')
                filePath = './www/index.html';
            var extname = wwwpath.extname(filePath);
               var contentType = 'text/html';
            switch (extname) {
                case '.zip':
                    contentType = 'application/octet-stream';
                    break;
            }
            fs.readFile(filePath, function(error, content){
                if (error){
                    if(error.code == 'ENOENT'){
                        fs.readFile('./www/404.html', function(error, content){
                            res.writeHead(200, { 'content-Type': 'text/html'});
                            res.end(content, 'utf-8');
                        });
                    } else {
                        res.writeHead(500);
                        res.end('Sorry, got this error: '+error.code+' ..'+filePath+'\n');
                        res.end();
                    }
                }
                else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        }).listen(wwwport);
        console.log("[x] Started internal webserver on port "+wwwport);
        resolve();
    });
}

//main loop
async function Main(){
    //Main loop- this sets initial values, logs startup, and then initiates loops for each activity
    console.log("[x] Starting Operation Torch " + ver + " on " + Date());
    console.log("[x] Loaded nodename: " + nodename);
    console.log("[x] Loaded internal IP: " + ip);
    xip = await getpublicIP(); console.log("[x] Loaded External IP: " + xip);
    macaddr = await getMac();
    location = await getLocation();
    await CheckELK();
    await startWebServer();
    await UpdateSensorNode();
    await UpdateMesh();
    var tUpdateMesh = setInterval(UpdateMesh, updatemesh_interval * 60000);console.log("[ ] Starting Mesh Update loop.  " + updatemesh_interval + " minute(s) between each check in with cluster.");
    var tSonarPing = setInterval(SonarPing, ping_internal * 1000);console.log("[ ] Starting Sonar Ping loop.  Running " + nodemesh.length + " test(s) every " + ping_internal + " seconds.");
    //Added to call SonarTCPPing (DKM)
    var tSonarTCPPing = setInterval(SonarTCPPing, ping_internal * 1000);console.log("[ ] Starting Sonar TCP Ping loop. Running " + nodemesh.length + "test(s) every " + ping_internal + " seconds.");
    var tUpdateSensorNode = setInterval(UpdateSensorNode, UpdateSensorNode_interval * 60000);console.log("[ ] Starting Update Loop for this node.  Heartbeat with cluster occurs every " + UpdateSensorNode_interval + " minute(s).");
    //SonarPing();
}

//All functions labelled 'Sonar' are one-time pulses across the network for all devices this one knows about
//Updated 01/07/2019 (DKM)
function SonarTCPPing(){
    //Framework (not in use yet) for a TCP ping function allowing port checks
    if (nodemesh.length == 0){console.log("[.] SonarTCPPing was called, but there are zero nodes in the mesh.")};
    nodemesh.forEach(function(node){
        //If this node for some reason doesn't have a WebPort property defined, skip it
        if (node.WebPort == undefined || node.WebPort == "") {
            console.log("[.] No WebPort defined for " + node.SensorName + " (" + node.IP + "), skipping.");
            return;
        }
        var objTCPOptions = new Object();
        objTCPOptions.address = node.IP;
        objTCPOptions.port = node.WebPort;
        objTCPOptions.timeout = 1000;
        objTCPOptions.attempts = 1;

        tcpping.ping(objTCPOptions, function(err, data) {
            var alive;
            var response_time = 0;

            if (!err) {
                alive = true;
                response_time = (data.results.avg).toFixed(0);
            }
            else {
                console.log("[.] SonarTCPPing encountered an error while testing " + data.address + ":" + data.port + ".");
                alive = false;
            }
            //Push our results
            client.index({
                index: 'sonar_tcpping',
                type: 'tcpping_result',
                body: {
                    LocationIP: xip,
                    toMAC: node.MAC,
                    Local: node.local,
                    Success: alive,
                    response_time: response_time,
                    timestamp: new Date().getTime(),
                    toSensorName: node.SensorName,
                    sensorName: nodename,
                    SensorMac: macaddr,
                    iIP: ip,
                    xIP: xip,
                    geolocation: {"lat": location.latitude, "lon": location.longitude},
                    latitude: location.latitude,
                    longitude: location.longitude,
                    City: location.city,
                    region: location.region,
                    zip: location.zip
                }
            });
        });

        /*
        tcpping.ping({ address: node.iIP, attempts:'1'}, function(err, results){
            var info = results.results;
            info.forEach(function(answer){
                console.log(answer);
            });
            console.log (node.iIP + " " + info.avg);
        });
        */
    })
}

function SonarPing(){
    //Ping all known devices in the mesh and upload success/ping times to cluster
    if (nodemesh.length == 0){console.log("[.] SonarPing was called, but there are no other active nodes in the mesh.")};
        nodemesh.forEach(function(node){
            ping.promise.probe(node.IP, { timeout: 3})
            //ping.promise.probe('196.168.10.1', { timeout: 3})
            .then(function(result) {
                //console.log(result.alive + " from: " + ip + " MAC: " + macaddr + " to: " + node.IP + " " + node.MAC + " took: " + result.time + " ms.");
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
                        LocationIP: xip,
                        toMAC: node.MAC,
                        Local: node.local,
                        Success: result.alive,
                        response_time: response_time,
                        timestamp: new Date().getTime(),
                        toSensorName: node.SensorName,
                        sensorName: nodename,
                        SensorMac: macaddr,
                        iIP: ip,
                        xIP: xip,
                        geolocation: {"lat": location.latitude, "lon": location.longitude},
                        latitude: location.latitude,
                        longitude: location.longitude,
                        City: location.city,
                        region: location.region,
                        zip: location.zip
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
            type: 'sensor_node',
            "body": {
                "query": {
                    "range" :{
                        "timestamp": {"gte" : "now-" + NodeAgeLimit + "m"}
                    }
                }
            }
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
                        "local": local,
                        "SensorName": resp._source.SensorName,
                        "WebPort": resp._source.WebPort //Added in WebPort (DKM)
                    });
                }
            });
            console.log("[ ] Updated node mesh.  My total workload: " + nodemesh.length);
            resolve(nodemesh);
        });
    });
}

function UpdateSensorNode() {
    // Connect to cluster and either add this node as a new one or refresh as current one
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
                        "WebPort" : wwwport, //Added in wwwport (DKM)
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
                        "WebPort" : wwwport, //Added in wwwport (DKM)
                        "timestamp": new Date().getTime(),
                        "location": {"lat": location.latitude, "lon": location.longitude},
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