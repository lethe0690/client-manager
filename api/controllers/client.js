const dataModel = require('../dataModel/dataModel');
const uuid = require('uuid/v4');
const log = require('../../logger');


function auth(req, res, next) {
    // if ('apikey' == req.swagger.params["Authorization"].value) {
    //     next();
    // }
    // else {
    //     log.warn("unauthorized request", {source: "api/controllers/client"});
    //     res.status(401);
    //     res.json({
    //         message: 'unauthorized'
    //     });
    // }
    next();
}

function errorHandler(res, err, statusCode, message) {
    // generate a unique identifier, using uuid
    let id = uuid();

    // it is optional to show to the client this ID, and the log will have this ID for sure
    // it will help with debug some tricky client problems
    log.error(err, {source: "api/controllers/client", ref: id});

    res.status(statusCode);
    res.json({
        message: message,
        ref: id
    });
}


function createClient(req, res) {

    auth(req, res, ()=> {

        let form = req.swagger.params["form"].value;

        //client record
        let cr = new dataModel.client(form);

        cr.save((err)=> {
            if (err) return errorHandler(res, err, 500, 'internal error');

            res.json('true');
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
            .exec((err, result)=> {
                if (err) {
                    errorHandler(res, err, 500, 'internal error');
                }

                res.json(result);
            });

    })
}

function updateClient(req, res) {

    auth(req, res, ()=> {

        let cid = req.swagger.params["id"].value;
        let form = req.swagger.params["form"].value;

        dataModel.client.findOneAndUpdate({_id: cid}, {$set: form}, (err)=> {

            if (err)  return errorHandler(res, err, 500, 'internal error');

            res.status(204);
            res.send();
        })

    })
}

function deleteClient(req, res) {

    auth(req, res, ()=> {

        let cid = req.swagger.params["id"].value;

        dataModel.client.remove({_id: cid}, (err)=> {

            if (err)  return errorHandler(res, err, 500, 'internal error');

            res.status(204);
            res.send();
        })
    })
}

module.exports = {createClient, getClient, updateClient, deleteClient};