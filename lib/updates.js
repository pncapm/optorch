const client = require('./elk.js')
const logger=require('./logger.js');

module.exports = {

    UpdateMesh: function(NodeAgeLimit, macaddr, xip) {
        // Connect to cluster and return all nodes minus this one
        return new Promise(function(resolve,reject){
            client.search({
                index: global.sensorgrid,
                type: 'node',
                "body": {
                    "query": {
                        "match_all" : {}
                    }
                }
            }).then(function(resp){
                global.nodemesh.length = 0;
                var results = resp.hits.hits;
                var ctimestamp = new Date().getTime();
                results.forEach(function(resp){
                    switch (resp._source.sensor_type){
                        case "grid":
                            if((Math.abs(resp._source.timestamp - ctimestamp))/60000 < NodeAgeLimit && resp._source.sensor_mac != macaddr){
                                //console.log("adding "+resp._source.sensor_name);
                                //If this node's external IP matches the external_address of a node, the it's local and we'll
                                //communicate to it on it's internal IP (Added comment and modified to use sensor_gridv2 attribute names - DKM)
                                if(xip == resp._source.external_address){
                                    var sensor_address = resp._source.sensor_address;
                                    var local = true;
                                } else {
                                    var sensor_address = resp._source.external_address;
                                    var local = false;
                                }
                                global.nodemesh.push({
                                    "sensor_type": resp._source.sensor_type,
                                    "sensor_address": sensor_address,
                                    "sensor_mac": resp._source.sensor_mac,
                                    "local": local,
                                    "icmp": resp._source.icmp,
                                    "sensor_name": resp._source.sensor_name,
                                    "port": resp._source.port, //Added in WebPort (DKM)
                                    "active" : resp._source.active
                                });
                            }
                        break;

                        default:
                        // add default sensor_type behavior here
                        //console.log("going with default process");
                        break;
                    }
                });
                logger.silly("Updated node mesh.  My total workload: " + global.nodemesh.length);
                resolve(global.nodemesh);
            });
        });
    },
    UpdateSensorNode:function(nodename, macaddr, ip, xip, location, wwwport, CheckTCP) {
        // Connect to cluster and either add this node as a new one or refresh as current one
        return new Promise(function(resolve,reject){
            client.search({
                index: global.sensorgrid,
                body: {
                    query: {
                        term: {"sensor_mac.keyword": macaddr}
                    }
                } 
            }).then(function(resp) {
                var results = resp.hits.hits;
                var elkID;
                (results).forEach(function(result){
                    elkID = result._id;
                });
                // Set wwwport to 0 if this node can't be reached
                if (!CheckTCP){
                    wwwport = 0;
                }
                var payload = '{'
                    +'"sensor_type" : "grid",'
                    +'"sensor_name" : "'+nodename+'",'
                    +'"optorch_ver" : "'+global.optorch_version+'",'
                    +'"icmp" : '+'true'+','
                    +'"sensor_address" : "'+ip+'",'
                    +'"external_address" : "'+xip+'",'
                    +'"timestamp" : "'+new Date().getTime()+'",'
                    +'"location" : {"lat" : '+location.latitude+', "lon" : '+location.longitude+'},'
                    +'"port" : '+wwwport+','
                    +'"sensor_mac" : "'+macaddr+'",'
                    +'"active" : '+'true'
                    +'}';
                if(elkID){
                    //ID exists do an update
                    logger.silly("Checking in with ELK cluster as sensor node ID: '" + elkID + "'");
                    client.index({
                        index: global.sensorgrid,
                        type: 'node',
                        id: elkID,
                        body: payload
                    });
                } else {
                    //This is a new node or node was deleted.  Create a new instance
                    logger.info("Creating new entry for this sensor node.");
                    client.index({
                        index: global.sensorgrid,
                        type: 'node',
                        body: payload
                    });
                }
                resolve();
            }, function(err) {
                console.trace(err.message);
            });
        });
    }
}