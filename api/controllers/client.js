const dataModel = require('../dataModel/dataModel');
const auth = require('./auth').auth;
const errors = require('./errorHandler');
const moment = require('moment');

function getDateBefore(years) {
    return moment().subtract(parseInt(years), 'years').toDate();
}

function createClient(req, res) {
    auth(req, res, ()=> {

        let form = req.swagger.params["form"].value;

        //client record
        dataModel.client.create(form)
            .then((client)=> {
                res.json(client._id);
            })
            .catch((err)=> {
                return errors.errorHandler(res, err, 'controllers/client', 500, 'internal error');
            })

    })
}

function getClient(req, res) {

    auth(req, res, ()=> {

        let option = {};
        let limit = 10;

        // to get all query params and determine if this query has special limit
        Object.keys(req.swagger.params).forEach((item)=> {
            if (item === 'limit') limit = req.swagger.params[item].value;

            // determine if the age range is set for query, this need some special treatment
            // passing into the option like {..., dob :{ $lte: date, $get : date} }
            // construct the time with standard ISO string as saved inside database
            else if (item === 'maxage') option.dob['$gte'] = new Date(getDateBefore(req.swagger.params[item].value));
            else if (item === 'minage') option.dob['$lte'] = new Date(getDateBefore(req.swagger.params[item].value));

            else {
                if (req.swagger.params[item].value) option[item] = req.swagger.params[item].value;
            }

        });

        dataModel.client
            .find(option, {
                // can decide what field to show to the client, right now display everything for simple
                __v: 0
            })
            .limit(limit)
            .lean()
            .exec()
            .then((result)=> {
                res.json(result);
            })
            .catch((err)=> {
                return errors.errorHandler(res, err, 'controllers/client', 500, 'internal error');
            })

    })
}

function updateClient(req, res) {

    auth(req, res, ()=> {

        let cid = req.swagger.params["id"].value;
        let form = req.swagger.params["form"].value;

        dataModel.client.findOneAndUpdate({_id: cid}, {$set: form})
            .then((client)=> {

                if (!client) {
                    res.status(404);
                    return res.json({
                        message: 'client not found'
                    });
                }

                res.status(204);
                res.send();
            })
            .catch((err)=> {
                return errors.errorHandler(res, err, 'controllers/client', 500, 'internal error');
            })
    })
}

function deleteClient(req, res) {

    auth(req, res, ()=> {

        let cid = req.swagger.params["id"].value;

        dataModel.client.remove({_id: cid})
            .then((writeOp)=> {

                if (writeOp.result.n === 0) {
                    res.status(404);
                    return res.json({
                        message: 'client not found'
                    });
                }

                res.status(204);
                res.send();
            })
            .catch((err)=> {
                return errors.errorHandler(res, err, 'controllers/client', 500, 'internal error');
            })
    })
}

module.exports = {createClient, getClient, updateClient, deleteClient, getDateBefore};