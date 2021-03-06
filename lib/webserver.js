const www = require('http');
const wwwpath = require('path');
const fs = require('fs');
const logger=require('./logger.js');

module.exports = {
    startWebServer: function(wwwport, macaddr) {
        //startup a simple webserver for TCP pings and file downloads
        return new Promise(function(resolve, reject){
            www.createServer(function (req, res){
                var filePath = './www' + req.url;
                if (filePath == './www/')
                    filePath = './www/index.html';
                var extname = wwwpath.extname(filePath);
                var contentType = 'text/html';
                switch (extname) {
                    case '.zip':
                        contentType = 'application/octet-stream';
                        break;
                }
                fs.readFile(filePath, function(error, content){
                    if (error){
                        if(error.code == 'ENOENT'){
                            fs.readFile('./www/404.html', function(error, content){
                                res.writeHead(404, { 'content-Type': 'text/html'}); //Switched from returning 200 to 404 (DKM)
                                res.end(content, 'utf-8');
                            });
                        } else {
                            res.writeHead(500);
                            res.end('Sorry, got this error: '+error.code+' ..'+filePath+'\n');
                            res.end();
                        }
                    }
                    else {
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(content+macaddr, 'utf-8');
                    }
                });
            }).listen(wwwport);
            logger.info("Started internal webserver on port "+wwwport);
            resolve();
        });
    }
}