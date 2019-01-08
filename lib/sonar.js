module.exports = {
    TCPPing: function(){
        //Framework for a TCP ping function allowing port checks
        if (global.nodemesh.length == 0){console.log("[.] SonarTCPPing was called, but there are zero nodes in the mesh.")};
        global.nodemesh.forEach(function(node){
            tcpping.ping({ address: node.iIP, attempts:'1'}, function(err, results){
                var info = results.results;
                info.forEach(function(answer){
                    console.log(answer);
                });
                console.log (node.iIP + " " + info.avg);
            });
        })
    },
    Ping: function(){
        //Ping all known devices in the mesh and upload success/ping times to cluster
        if (global.nodemesh.length == 0){console.log("[.] SonarPing was called, but there are no other active nodes in the mesh.")};
            global.nodemesh.forEach(function(node){
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
}