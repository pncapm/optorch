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
                                if(xip == resp._source.xip){
                                    var location = resp._source.url;
                                    var local = true;
                                } else {
                                    var location = resp._source.xip;
                                    var local = false;
                                }
                                global.nodemesh.push({
                                    "sensor_type": resp._source.sensor_type,
                                    "url": location,
                                    "mac": resp._source.sensor_mac,
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
                        console.log("going with default process");
                        break;
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
                var payload = '{'
                    +'"sensor_type" : "grid",'
                    +'"sensor_name" : "'+nodename+'",'
                    +'"icmp" : '+'true'+','
                    +'"url" : "'+ip+'",'
                    +'"xip" : "'+xip+'",'
                    +'"timestamp" : "'+new Date().getTime()+'",'
                    +'"location" : {"lat" : '+location.latitude+', "lon" : '+location.longitude+'},'
                    +'"port" : '+wwwport+','
                    +'"username" : "'+'ted'+'",'
                    +'"password" : "'+'hairypancakes'+'",'
                    +'"payload" : "'+'select * from happy place'+'",'
                    +'"resp_code" : "'+'200|201'+'",'
                    +'"resp_criteria" : "'+'hello test user 1'+'",'
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