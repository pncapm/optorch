

module.exports = {
    Display_nodemesh: function(){
        return new Promise(function(resolve,reject){
            //debug function to show all current items in nodemesh
            console.log("listing nodes:")
            global.nodemesh.forEach(function(node){
                console.log(node);
            });
            resolve();
        });
    }
}