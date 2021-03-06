// variables that can be set
global.elkDB = 'https://optorch.com:9201'; //ELK cluster location (uses a global variable as it's needed in various places)
global.sensorgrid = "sensor_gridv2";
global.optorch_version = "1.0"; //Manually set optorch version # to ensure everybody on the same one
//const wwwport = 9000; // port the web server should use (must be > 1024) (Commented out and moved to init.getWebPort in Main() by DKM)
const ping_interval = 5; // how long between ICMP pings in seconds
const tcpping_interval = 60; // how long between TCP tests in seconds (Added by DKM, set back to seconds by SXP)
const httpping_interval = 5; // how long between HTTP tests in *minutes* (Added by DKM)
const updatemesh_interval = 1 // how long between getting new mesh data in *minutes*
const UpdateSensorNode_interval = 1  // how long to wait between cluster heartbeats in *minutes*
const NodeAgeLimit = 60 //maximum age in *minutes* other nodes will be included before being ignored as dead

// global variable setup (not user changeable)
global.nodemesh = [];

// Include local files
const init = require("./lib/init.js"); // all startup/initial check functions
const webserver = require("./lib/webserver.js") // my internal webserver startup/config
const updates = require("./lib/updates.js") //functions that update the sensor grid
const sonar = require("./lib/sonar.js") // all functions intended to run as loops against the nodemesh array and record results to cluster
const logger = require("./lib/logger.js") //implement much gooder logging
const helper = require ("./lib/helper.js") // helper files to help in debugging.  None of these should be left in for production.

//main loop
async function Main(){ //Main loop- this sets initial values, logs startup, and then initiates loops for each activity (There's so much room for activities!)
    logger.info("Starting Operation Torch " + global.optorch_version);
    const nodename = require('os').hostname(); logger.info("Loaded nodename: " + nodename);
    const ip = await init.getIP(); logger.info("Loaded internal IP: " + ip);
    const xip = await init.getpublicIP(); logger.info("Loaded External IP: " + xip);
    macaddr = await init.getMac();
    location = await init.getLocation(xip);
    
    const ConfigOptions = init.getConfigOptions(); //Added by DKM
    //Added section below to extract local node web port from config options
    var myWebPort = ConfigOptions.wwwport;
    //If the wwwport ends up not being in our conf file or is not a valid number default it to 9000
    if (myWebPort == undefined || isNaN(myWebPort)) {
        logger.info("Property wwwport either not defined or is not a valid number: " + myWebPort + ". Defaulting to port 9000");
        myWebPort = 9000;
    }
    else {
        myWebPort = parseInt(myWebPort); //Force to an int type
    }
    const wwwport = myWebPort; //Move to a constant

    await init.CheckELK();
    await webserver.startWebServer(wwwport, macaddr);
    const CheckTCP = await init.CheckTCPSelf(xip, wwwport);
    await updates.UpdateSensorNode(nodename, macaddr, ip, xip, location, wwwport, CheckTCP);
    await updates.UpdateMesh(NodeAgeLimit, macaddr, xip);
    //await helper.Display_nodemesh();
    var tUpdateMesh = setInterval(function(){updates.UpdateMesh(NodeAgeLimit, macaddr, xip);}, updatemesh_interval * 60000);logger.info("Starting Mesh Update loop.  " + updatemesh_interval + " minute(s) between each check in with cluster.");
    var tSonarPing = setInterval(function(){sonar.Ping(ip,xip,nodename,macaddr, location);}, ping_interval * 1000);logger.info("Starting Sonar Ping loop.  Running " + global.nodemesh.length + " test(s) every " + ping_interval + " seconds.");
    var tSonarTcpPing = setInterval(function(){sonar.TCPPing(ip,xip,nodename,macaddr, location);}, tcpping_interval * 1000);logger.info("Starting Sonar TCP Ping loop.  Running " + global.nodemesh.length + " test(s) every " + tcpping_interval + " second(s).");
    var tSonarHttpPing = setInterval(function(){sonar.HTTPPing(ip,xip,nodename,macaddr, location);}, httpping_interval * 60000);logger.info("Starting Sonar HTTP Ping loop.  Running " + global.nodemesh.length + " test(s) every " + httpping_interval + " minutes.");
    var tUpdateSensorNode = setInterval(function(){updates.UpdateSensorNode(nodename, macaddr, ip, xip, location, wwwport);}, UpdateSensorNode_interval * 60000);logger.info("Starting Update Loop for this node.  Heartbeat with cluster occurs every " + UpdateSensorNode_interval + " minute(s).");   
}
Main(); // Kick it off