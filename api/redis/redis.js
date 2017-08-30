const config = require("../../config");

//using ioredis here since it support cluster mode
const Redis = require('ioredis');

const redisclient = new Redis({
    port: config.redis_port || 6379,          // Redis port
    host: config.redis_host || '127.0.0.1',   // Redis host
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    //password: '',
    db: config.redis_db || 0
});

const EXPIRE_TIME = config.redis_ttl;


function getCache(key) {
    return new Promise((reslove, reject)=> {
        redisclient.get(`query:${key}`, (err, result)=> {
            if (err) reject(err);

            // if the key not exist
            else reslove(result ? JSON.parse(result) : false);
        });

    });

}

function setCache(key, value) {
    redisclient.set(`query:${key}`, value, 'EX', EXPIRE_TIME);
}

module.exports = {getCache, setCache};