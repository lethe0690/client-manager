const mongoose = require('mongoose');
const log = require("../../logger");
const config = require('../../config');

mongoose.connect(config.db_mongo_connection, (err)=> {

    if (err) {
        log.error(err, {source: "api/dataModel/mongo"});
        process.exit(1);
    }

    mongoose.Promise = global.Promise;

    log.info("mongoDB connected", {source: "api/dataModel/mongo"});
});

module.exports = mongoose;
