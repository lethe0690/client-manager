const winston = require('winston');
const moment = require('moment');
const config = require("./config");

let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            timestamp: function () {
                return moment.utc().format('YYMMDD-HH:mm:ss');
            },
            formatter: function (options) {
                // Return string will be passed to logger.
                //YYMMDD:HHMMSS – [ENV] [APP] [WARN] [SOURCE][REF] – Logging message
                return JSON.stringify(
                    options.timestamp() + '-[' + config.env + '][' + config.appName + '][' + options.level.toUpperCase() + ']' +
                    '[' + (undefined !== options.meta.source ? options.meta.source : '') + ']' +
                    '[' + (undefined !== options.meta.ref ? options.meta.ref : '') + ']-' +
                    (undefined !== options.message ? options.message : '')
                );
            }
        })

    ]
});

logger.exitOnError = false;

module.exports = logger;
