const uuid = require('uuid/v4');
const log = require('../../logger');

function errorHandler(res, err, source, statusCode, message) {
    // generate a unique identifier, using uuid
    let id = uuid();

    // it is optional to show to the client this ID, and the log will have this ID for sure
    // it will help with debug some tricky client problems
    log.error(err, {source: source ? source : 'unknown', ref: id});

    res.status(statusCode);
    res.json({
        message: message,
        ref: id
    });
}

module.exports = {errorHandler};