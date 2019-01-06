
const www = require('http');
const wwwurl = require('url');
const wwwfs = require('fs');
const wwwpath = require('path');
var wwwport = 90;

function startWebServer(){
        //startup a simple webserver for TCP requests
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
                wwwfs.readFile(filePath, function(error, content){
                    if (error){
                        if(error.code == 'ENOENT'){
                            wwwfs.readFile('./www/404.html', function(error, content){
                                res.writeHead(200, { 'content-Type': 'text/html'});
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
                        res.end(content, 'utf-8');
                    }
                });
            }).listen(wwwport);
            resolve();
        });
}

async function Main(){
    await startWebServer();
    console.log("server started");
}

Main();