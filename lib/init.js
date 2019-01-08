const nic = require('getmac');
const publicIP = require('public-ip');
const iplocation = require("iplocation").default;
const client = require('./elk.js')

module.exports = {
    getMac: function() {
        //return this device's internal IP address
        return new Promise(function(resolve, reject){
            nic.getMac(function(err,macAddress){
                macaddr = macAddress.replace(/:/g,'-');
                console.log("[x] Loaded MAC address: " + macaddr);
                resolve(macaddr);
            });
        });
    },
    getpublicIP: function(){
        //return this device's external IP address.
        return new Promise(function(resolve,reject){
            var a = publicIP.v4();
            resolve(a);
        }).catch(function(err){
            console.warn("[.] Failed to get external IP.  Fireball blocking?  Used 0 for External IP.");
            return(0);
        });
    },
    getLocation: function(xip){
        //Pull basic geographic information based on external IP
        return iplocation(xip, ["https://ipinfo.io/*"])
        .then((result)=> {
            location = result;
            console.log("[x] Loaded GEO: " + location.latitude + "/" + location.longitude);
            if (!location.latitude || !location.longitude){
                throw ("Process ran, but no latitude or longitude was returned");
            };
            return(location);
        })
        .catch(err => {
            console.log("[!] Could not get Location from " + xip + ", so using 0/0 (" + err + ")");
            var location = {latitude:0,longitude:0};
            return(location);
        });
    },
    CheckELK: function(){
        //Ping the ELK cluster to ensure this device will be able to communicate with home base
        return new Promise(function(resolve,reject){
            client.ping({
                requestTimeout: 3000 // use 3s timeout for ELK
            }, function (error) {
                if (error) {
                console.error("[!] ELK cluster cannot be reached at: " + global.elkDB + ".  Bailing out.");
                process.exit(1);
                } else {
                console.log("[x] Confirmed ELK cluster can be reached at: " + global.elkDB + ".");
                resolve();
                }
            });
        });
    }

};