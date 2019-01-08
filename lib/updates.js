const client = require('./elk.js')

module.exports = {

    UpdateMesh: function(NodeAgeLimit) {
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
                global.nodemesh.length = 0;
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
                        global.nodemesh.push({
                            "IP": location,
                            "MAC": resp._source.SensorMac,
                            "local": local,
                            "SensorName": resp._source.SensorName
                        });
                    }
                });
                console.log("[ ] Updated node mesh.  My total workload: " + global.nodemesh.length);
                resolve(global.nodemesh);
            });
        });
    },
    UpdateSensorNode:function(nodename, macaddr, ip, xip, location) {
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
}