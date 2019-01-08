// variables that can be set
global.elkDB = 'https://optorch.com:9201'; //ELK cluster location (uses a global variable as it's needed in various places)
const wwwport = 9000; // port the web server should use (must be > 1024)
const ping_internal = 5; // how long between ICMP pings in seconds
const updatemesh_interval = 1 // how long between getting new mesh data in *minutes*
const UpdateSensorNode_interval = 1  // how long to wait between cluster heartbeats in *minutes*
const NodeAgeLimit = 5 //maximum age in *minutes* other nodes will be included before being ignored as dead

// internal variables that should be left alone
global.nodemesh = [];


// Include local files
const init = require("./lib/init.js"); // all startup/initial check functions
const webserver = require("./lib/webserver.js") // my internal webserver startup/config
const updates = require("./lib/updates.js") //functions that update the sensor grid
const sonar = require("./lib/sonar.js") // all functions intended to run as loops against the nodemesh array

// Include NPM modules
const ping = require ("ping");
const nodename = require('os').hostname();
const ip = require('quick-local-ip').getLocalIP4();
//const tcpping = require("tcp-ping");

//main loop
async function Main(){
    //Main loop- this sets initial values, logs startup, and then initiates loops for each activity
    console.log("[x] Starting Operation Torch on " + Date());
    console.log("[x] Loaded nodename: " + nodename);
    console.log("[x] Loaded internal IP: " + ip);
    xip = await init.getpublicIP(); console.log("[x] Loaded External IP: " + xip);
    macaddr = await init.getMac();
    location = await init.getLocation(xip);
    await init.CheckELK();
    await webserver.startWebServer(wwwport);
    await updates.UpdateSensorNode(nodename, macaddr, ip, xip, location);
    await updates.UpdateMesh(NodeAgeLimit);
    var tUpdateMesh = setInterval(function(){updates.UpdateMesh(NodeAgeLimit);}, updatemesh_interval * 60000);console.log("[ ] Starting Mesh Update loop.  " + updatemesh_interval + " minute(s) between each check in with cluster.");
    var tSonarPing = setInterval(function(){sonar.Ping();}, ping_internal * 1000);console.log("[ ] Starting Sonar Ping loop.  Running " + global.nodemesh.length + " test(s) every " + ping_internal + " seconds.");
    var tUpdateSensorNode = setInterval(function(){updates.UpdateSensorNode(client, nodename, macaddr, ip, xip, location);}, UpdateSensorNode_interval * 60000);console.log("[ ] Starting Update Loop for this node.  Heartbeat with cluster occurs every " + UpdateSensorNode_interval + " minute(s).");
}

// Kick it off
Main();