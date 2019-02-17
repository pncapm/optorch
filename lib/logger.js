const { createLogger, format, transports } = require('winston');

// get command line arg for level
function Args(){
    var stuff = new Object();
    process.argv.forEach(function (val, index, array) {
        if (val == "info" || val == "warn" || val == "silly"){
            stuff.loglevel = val;
        }
        // set default log level if none selected
        if (!stuff.hasOwnProperty('loglevel')){stuff.loglevel = "info";}
  });
  return stuff;
}

var results = new Args();

module.exports= createLogger({
    transports: [
        new transports.Console({
            level: results.loglevel,
            format: format.combine(
                format.colorize(),
                //format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                format.simple()
            )
        }),
        new transports.File({
            level: 'info',
            filename: './logs/optorch.log',
            maxsize: 52428800,
            maxFiles: 1,
            format: format.combine(
                format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                format.json()
            )
        })
    ]
    });

    // Logging Level Options
    //     error: 0, 
    //     warn: 1, 
    //     info: 2, 
    //     verbose: 3, 
    //     debug: 4, 
    //     silly: 5 
