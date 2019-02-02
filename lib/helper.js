

module.exports = {
    Display_nodemesh: function(ip,xip,nodename,macaddr, location){
        //debug function to show all current items in nodemesh
        global.nodemesh.forEach(function(node){
            console.log("nodes" + node);
        });
    }
}