const fs = require('fs');
const ping = require('ping');
const tping = './config/ping.init';

fs.readfile(tping, 'utf8', function(err, contents){
    console.log(contents);

});

