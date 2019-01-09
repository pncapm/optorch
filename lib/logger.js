const { createLogger, format, transports } = require('winston');
module.exports= createLogger({
    transports: [
        new transports.Console({
            level: 'silly',
            format: format.combine(
                format.colorize(),
                //format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                format.simple()
            )
        }),
        new transports.File({
            level: 'info',
            filename: './logs/optorch.log',
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
