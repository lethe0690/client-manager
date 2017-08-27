const env = process.env.NODE_ENV || 'development';

const config = require(`./config/config.${env}.js`);

if (!config) {
    console.error(`Configuration file config.${env}.js not found.`);
    process.exit();
}

console.log('Using environment: ' + env);

config.env = env;

module.exports = config;
