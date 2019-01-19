const client = require('./elk.js')
const logger=require('./logger.js');

module.exports = {

    UpdateMesh: function(NodeAgeLimit, macaddr, xip) {
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
                            "SensorName": resp._source.SensorName,
                            "WebPort": resp._source.WebPort //Added in WebPort (DKM)
                        });
                    }
                });
                logger.silly("Updated node mesh.  My total workload: " + global.nodemesh.length);
                resolve(global.nodemesh);
            });
        });
    },
    UpdateSensorNode:function(nodename, macaddr, ip, xip, location, wwwport) {
        // Connect to cluster and either add this node as a new one or refresh as current one
        return new Promise(function(resolve,reject){
            client.search({
                index: 'sensor_grid',
                body: {
                    query: {
                        term: {"SensorMac.keyword": macaddr}
                    }
                } 
            }).then(function(resp) {
                var results = resp.hits.hits;
                var elkID;
                (results).forEach(function(result){
                    elkID = result._id;
                });
                if(elkID){
                    //ID exists do an update
                    logger.silly("Checking in with ELK cluster as sensor node ID: '" + elkID + "'");
                    client.index({
                        index: 'sensor_grid',
                        type: 'sensor_node',
                        id: elkID,
                        body: {
                            "SensorType": 'grid',
                            "SensorName" : nodename,
                            "SensorMac" : macaddr,
                            "iIP" : ip,
                            "xIP" : xip,
                            "WebPort" : wwwport, //Added in WebPort (DKM)
                            "timestamp" : new Date().getTime(),
                            "location": {"lat": location.latitude, "lon": location.longitude},
                            "latitude": location.latitude,
                            "longitude": location.longitude
                        }
                    });
                } else {
                    //This is a new node or node was deleted.  Create a new instance
                    logger.info("CREATING new entry for this sensor node.");
                    client.index({
                        index: 'sensor_grid',
                        type: 'sensor_node',
                        body: {
                            "SensorType": 'grid',
                            "SensorName": nodename,
                            "SensorMac": macaddr,
                            "iIP": ip,
                            "xIP": xip,
                            "WebPort" : wwwport, //Added in WebPort (DKM)
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