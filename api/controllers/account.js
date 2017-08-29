const dataModel = require('../dataModel/dataModel');
const redis = require('../redis/redis');

function generateAccountNumber(n) {
    // n is the number of account number you may want to generate
    // n should be a positive integer
    if (!(n >>> 0 === parseFloat(n))) return new Error('invalid number');

    let acs = [];
    for (i = 0; i < n; i++) {
        /* use utc timestamp which is 13 digits since utc is self-incremental and unique
         remove the first 3 digits and replace the next 2 digits with random number

         this approach may have very small chance to generate duplicate only when account
         is generated at a exactly circle time (all last 8 digits of utc match and the random number
         is the same, which is quite low and can not happen within a few months circle)

         however, this approach may expose the time of account created, which may
         be considered as sensitive info. To achieve a more random or a more meaningful account number
         I can use a POOL service either created by my app or by another provider, the interface will be like
         pool.getAccounts() and it return few available accounts or certain errors.
         */

        let stamp = Date.now().toString().substring(3, 13).split('');
        stamp[0] = Math.floor(Math.random() * (9 - 1)) + 1;
        stamp[1] = Math.floor(Math.random() * 9);
        acs.push(stamp.join(''));
    }

    return acs;
}

function getAccount(req, res) {

    auth(req, res, ()=> {
        let option = {};
        let limit = 10;
        let force = false;

        // to get all query params and determine if this query has special limit
        Object.keys(req.swagger.params).forEach((item)=> {
            if (item === 'limit') limit = req.swagger.params[item].value;
            else if (item === 'force') force = req.swagger.params[item].value;
            else {
                if (req.swagger.params[item].value) option[item] = req.swagger.params[item].value;
            }

        });

        //read from redis first if 'force' is not required, read from cache
        Promise
            .resolve()
            .then(()=> {
                if (!force) return redis.getCache('').then((result)=> {
                    // no cache, continue database search
                    if (!result) return Promise.resolve();

                    return res.json(res.json(result));
                });

                //force is true, just search database
                return Promise.resolve();
            })
            .then(()=> {
                return dataModel.account
                    .find(option, {
                        // can decide what field to show to the client, right now display everything for simple
                        __v: 0
                    })
                    .limit(limit)
                    .lean()
                    .exec((err, result)=> {
                        if (err) {
                            return errorHandler(res, err, 500, 'internal error');
                        }

                        res.json(result);
                    });
            })
            .catch((err)=> {

            })

    })
}

module.exports = {generateAccountNumber};