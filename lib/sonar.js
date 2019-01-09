const ping = require ("ping");
const client = require('./elk.js')
const logger = require("./logger.js")

module.exports = {
    TCPPing: function(){
        //Framework for a TCP ping function allowing port checks
        if (global.nodemesh.length == 0){logger.warn("SonarTCPPing was called, but there are zero nodes in the mesh.")};
        global.nodemesh.forEach(function(node){
            tcpping.ping({ address: node.iIP, attempts:'1'}, function(err, results){
                var info = results.results;
                info.forEach(function(answer){
                    logger.info(answer);
                });
                logger.info (node.iIP + " " + info.avg);
            });
        })
    },
    Ping: function(ip,xip,nodename,macaddr){
        //Ping all known devices in the mesh and upload success/ping times to cluster
        if (global.nodemesh.length == 0){logger.info("SonarPing was called, but there are no other active nodes in the mesh.")};
            global.nodemesh.forEach(function(node){
                ping.promise.probe(node.IP, { timeout: 3})
                .then(function(result) {
                    logger.silly("Sonar Ping: Ping " + ((result.alive) ? 'succeeded':'failed')  + " to " + node.SensorName + "(" +node.IP + ")/" + node.MAC + " and took " + result.time + " ms.");
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
            
                }).catch(function(err){
                    console.log(err);
                });
    
        });
    }
}