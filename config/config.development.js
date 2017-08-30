module.exports = {

    port: 5000,

    db_mongo_connection: 'mongodb://rbc:rbc@ds161503.mlab.com:61503/rbc',

    redis_port: 6379,
    redis_host: 'localhost',
    redis_db: 0,
    //unit in sec , 5 min in this case
    redis_ttl: 5 * 60,

    //for logs
    env: "DEV",
    appName: "CM"
};
