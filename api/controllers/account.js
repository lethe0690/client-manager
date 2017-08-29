const dataModel = require('../dataModel/dataModel');
const redis = require('../redis/redis');
const errors = require('./errorHandler');
const validator = require('./validator');
const auth = require('./auth').auth;

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
        let cacheKey = '';

        // to get all query params and determine if this query has special limit
        Object.keys(req.swagger.params).forEach((item)=> {
            if (item === 'limit') limit = req.swagger.params[item].value;
            else if (item === 'force') force = req.swagger.params[item].value;
            else {
                if (req.swagger.params[item].value) {
                    option[item] = req.swagger.params[item].value;
                    cacheKey += `${item}:${req.swagger.params[item].value}:`;
                }
            }

        });


        //read from redis first if 'force' is not required
        Promise
            .resolve()
            .then(()=> {
                if (!force) return redis.getCache(cacheKey).then((result)=> {
                    // no cache, continue database search
                    if (!result) return Promise.resolve();

                    return res.json(result);
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
                    .exec()
                    .then((result)=> {
                        //set up the redis cache
                        redis.setCache(cacheKey, JSON.stringify(result));
                        return res.json(result);
                    });

            })
            .catch((err)=> {
                return errors.errorHandler(res, err, 'controllers/account', 500, 'internal error');
            })

    })
}

function createAccount(req, res) {
    auth(req, res, ()=> {

        let form = req.swagger.params["form"].value;

        try {
            validator.validate(form);
        }
        catch (err) {
            res.status(400);
            res.json({message: err.message});
        }

        form.number = generateAccountNumber(1)[0];

        return dataModel.account
            .create(form)
            .then(()=> {
                res.json(form.number);
            })
            .catch((err)=> {
                return errors.errorHandler(res, err, 'controllers/account', 500, 'internal error');
            })
    })

}

function updateAccount(req, res) {

    auth(req, res, ()=> {

        let aid = req.swagger.params["id"].value;
        let form = req.swagger.params["form"].value;

        dataModel.account.findOneAndUpdate({number: aid}, {$set: form})
            .then((account)=> {

                if (!account) {
                    res.status(404);
                    return res.json({
                        message: 'account not found'
                    });
                }

                res.status(204);
                res.send();
            })
            .catch((err)=> {
                return errors.errorHandler(res, err, 'controllers/account', 500, 'internal error');
            })

    })
}

function deleteAccount(req, res) {

    auth(req, res, ()=> {

        let aid = req.swagger.params["id"].value;

        dataModel.account.remove({number: aid})
            .then((writeOp)=> {

                if (writeOp.result.n === 0) {
                    res.status(404);
                    return res.json({
                        message: 'account not found'
                    });
                }

                res.status(204);
                return res.send();
            })
            .catch((err)=> {
                return errors.errorHandler(res, err, 'controllers/account', 500, 'internal error');
            })

    });
}

module.exports = {generateAccountNumber, getAccount, createAccount, updateAccount, deleteAccount};
