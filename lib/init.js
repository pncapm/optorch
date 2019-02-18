const nic = require('getmac');
const publicIP = require('public-ip');
const iplocation = require("iplocation").default;
const client = require('./elk.js');
const logger=require('./logger.js');
const properties = require('properties-parser');

module.exports = {
    getMac: function() {
        //return this device's internal IP address
        return new Promise(function(resolve, reject){
            nic.getMac(function(err,macAddress){
                macaddr = macAddress.replace(/:/g,'-');
                logger.info("Loaded MAC address: " + macaddr);
                resolve(macaddr);
            });
        });
    },
    getIP: function(){
        //Return local IP
        return new Promise(function(resolve,reject){
            var os = require('os');
            var ifaces = os.networkInterfaces();
            Object.keys(ifaces).forEach(function (ifname) {
            var alias = 0;
            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                } else {
                resolve(iface.address);
                }
            });
            });
        }).catch(function(err){
            console.trace(err);
        });
    },
    getpublicIP: function(){
        //return this device's external IP address.
        return new Promise(function(resolve,reject){
            var a = publicIP.v4();
            resolve(a);
        }).catch(function(err){
            logger.warn("Failed to get external IP.  Fireball blocking?  Used 0 for External IP.");
            return(0);
        });
    },
    getLocation: function(xip){
        //Pull basic geographic information based on external IP
        return iplocation(xip, ["https://ipinfo.io/*"])
        .then((result)=> {
            location = result;
            logger.info("Loaded GEO: " + location.latitude + "/" + location.longitude);
            if (!location.latitude || !location.longitude){
                throw ("Process ran, but no latitude or longitude was returned");
            };
            return(location);
        })
        .catch(err => {
            logger.warn("Could not get Location from " + xip + ", so using 0/0 (" + err + ")");
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
                logger.error("ELK cluster cannot be reached at: " + global.elkDB + ".  Bailing out.");
                process.exit(1);
                } else {
                logger.info("Confirmed ELK cluster can be reached at: " + global.elkDB + ".");
                resolve();
                }
            });
        });
    },
    getConfigOptions: function() {
        //Modified function to simply return the config options object rather than a specific property

        //Parse a config file and return parameters, or default value
        try {
            var objProps = properties.read("./config/app.conf");
            //var myWebPort = objProps.wwwport;
            return objProps;
        } catch(e) {
            logger.info("Could not read ./config/app.conf.  Using defaults.");
        }

        /*
        //If the wwwport ends up not being in our conf file or is not a valid number default it to 9000
        if (myWebPort == undefined || isNaN(myWebPort)) {
            logger.info("Property wwwport either not defined or is not a valid number: " + myWebPort + ". Defaulting to port 9000");
            myWebPort = 9000;
        }

        logger.info("Web Server Port: " + myWebPort);
        return myWebPort;
        */

    }

};