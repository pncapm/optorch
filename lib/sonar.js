const ping = require ("ping");
const tcpping = require("tcp-ping"); //Added by DKM
const client = require('./elk.js')
const logger = require("./logger.js")

module.exports = {
    TCPPing: function(ip,xip,nodename,macaddr, location){
        //Framework for a TCP ping function allowing port checks
        if (global.nodemesh.length == 0) {
            logger.silly("SonarTCPPing was called, but there are zero nodes in the mesh.");
        };
        global.nodemesh.forEach(function(node){
            if (node.port == undefined || node.port == "" || isNaN(node.port || node.port == 0)) {
                logger.silly("No port defined for " + node.sensor_name + " (" + node.url + "), skipping.");
                return; //i.e. skip this node
            }

            var objTCPOptions = new Object();
            objTCPOptions.address = node.url;
            objTCPOptions.port = parseInt(node.port);
            objTCPOptions.timeout = 1000;
            objTCPOptions.attempts = 1;

            try {
                tcpping.ping(objTCPOptions, function(err, data) {
                    var bAlive = false;
                    var intRespTime = 0;

                    if (!err) {
                        //Found that tcpping.ping may not err, but return undefined for data.avg which basically means that it failed
                        if(!isNaN(data.avg)) {
                            bAlive = true;
                            intRespTime = (data.avg).toFixed(0);
                            logger.silly("Sonar TCP Ping: Success against "+node.url+":"+node.port);
                        }
                        else {
                            bAlive = false;
                            logger.warn("Sonar TCP Ping: FAILED against "+node.url+":"+node.port);

                        }

                        //Push our results
                        client.index({
                            index: 'sonar_ping',
                            type: 'ping_result',
                            body: {
                                action: "TCP",
                                LocationIP: xip,
                                toMAC: node.mac,
                                Local: node.local,
                                Success: bAlive,
                                response_time: intRespTime,
                                timestamp: new Date().getTime(),
                                toSensorName: node.sensor_name,
                                toPort: node.port,
                                sensorName: nodename,
                                SensorMac: macaddr,
                                iIP: ip,
                                xIP: xip,
                                geolocation: {"lat": location.latitude, "lon": location.longitude},
                                City: location.city,
                                region: location.region,
                                zip: location.zip
                            }
                        });
                    }
                    else {
                        logger.error("SonarTCPPing encountered an error while testing " + data.address + ":" + data.port + ".");
                    }
                
                });
            } catch(e) {
                logger.error("Error calling tcpping.ping() -- " + e.toString());
            }            
        })
    },
    Ping: function(ip,xip,nodename,macaddr, location){
        //Ping all known devices in the mesh and upload success/ping times to cluster
        if (global.nodemesh.length == 0){
            logger.silly("SonarPing was called, but there are no other active nodes in the mesh.");
        };
        global.nodemesh.forEach(function(node){
            if (node.active && node.local){
                ping.promise.probe(node.url, { timeout: 3})
                .then(function(result) {
                    logger.silly("Sonar Ping: Ping " + ((result.alive) ? 'succeeded':'failed')  + " to " + node.sensor_name + "(" +node.url + ")/" + node.mac + " and took " + result.time + " ms.");
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
                            action: "ICMP", //Added by DKM
                            LocationIP: xip,
                            toMAC: node.mac,
                            Local: node.local,
                            Success: result.alive,
                            response_time: response_time,
                            timestamp: new Date().getTime(),
                            toSensorName: node.sensor_name,
                            sensorName: nodename,
                            SensorMac: macaddr,
                            iIP: ip,
                            xIP: xip,
                            geolocation: {"lat": location.latitude, "lon": location.longitude},
                            City: location.city,
                            region: location.region,
                            zip: location.zip
                        }
                    });
                }).catch(function(err){
                console.log(err);
                });
            }
        });
    }
}