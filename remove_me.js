const elasticsearch = require('elasticsearch');
const nic = require('getmac');
var elkDB = 'https://optorch.com:9201';

//interal functions/setup
const client = new elasticsearch.Client( {
    hosts: [        
     elkDB
    ],
    log: 'error',
    ssl: {rejectUnauthorized: false}
});

function getMac(){
    return new Promise(function(resolve, reject){
        nic.getMac(function(err,macAddress){
            macaddr = macAddress.replace(/:/g,'-');
            console.log("[x] Loaded MAC address: " + macaddr);
            resolve(macaddr);
        });
    });
}

async function Main(){
    macaddr = await getMac();
    //macaddr = '02-42-bf-31-33-3f';  //uncomment to surgically remove any 1 specific mac
    client.deleteByQuery({
        index: 'sensor_grid',
        //type: 'sensor_node',
        q: 'SensorMac: ' + macaddr
    });
}
Main();