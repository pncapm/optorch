
const nic = require('getmac');
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
    }
}