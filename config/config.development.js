module.exports = {

    port: 5000,

    db_mongo_connection: 'mongodb://rbc:rbc@ds161503.mlab.com:61503/rbc',
    
    //unit in sec , 5 min in this case
    redis_ttl: 5 * 60,

    //for logs
    env: "DEV",
    appName: "CM"
};
