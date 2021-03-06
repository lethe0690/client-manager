const SwaggerExpress = require('swagger-express-mw');
const app = require('express')();

const config = require('./config');
const cors = require('cors');

const root = {
    appRoot: __dirname // required config
};

SwaggerExpress.create(root, function (err, swaggerExpress) {
    if (err) {
        throw err;
    }

    // install middleware
    swaggerExpress.register(app);

    // cross domain
    app.use(cors());

    let port = process.env.PORT || config.port || 5000;
    app.listen(port);

    console.log('app running on:' + port);

});
