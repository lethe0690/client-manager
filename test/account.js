const sinon = require('sinon');
const assert = require('chai').assert;
const dataModel = require('../api/dataModel/dataModel');
const errors = require('../api/controllers/errorHandler');
const account = require('../api/controllers/account');
const redis = require('../api/redis/redis');
const validator = require('../api/controllers/validator');

let sandbox;

// simulate an http request
let req = {
    swagger: {
        params: {
            form: {
                value: {
                    type: 'saving',
                    status: 'active'
                }
            }
        }
    }
};

let reqWithPathId = {
    swagger: {
        params: {
            id: {
                value: '1234567890'
            }
            ,
            form: {
                value: {
                    type: 'saving',
                    status: 'active'
                }
            }
        }
    }
};

let reqWithoutForce = {
    swagger: {
        params: {
            type: {
                value: 'saving'
            }
            ,
            number: {
                value: '1234567890'
            }
        }
    }
};

let reqWithForce = {
    swagger: {
        params: {
            force: {
                value: 'true'
            },
            type: {
                value: 'saving'
            }
            ,
            number: {
                value: '1234567890'
            }
        }
    }
};

let fakeRes = {
    name: 'fakeRes',
    json: function () {
    },
    send: function () {
    },
    status: function () {
    }
};

let fakeChain = {
    find: function () {
        return this;
    },
    limit: function () {
        return this;
    },
    lean: function () {
        return this;
    },
    exec: function () {
        return Promise.resolve({data: 'fake data'});
    }
};

let fakeChainReject = {
    find: function () {
        return this;
    },
    limit: function () {
        return this;
    },
    lean: function () {
        return this;
    },
    exec: function () {
        return Promise.reject({error: 'database error'});
    }
};

let dbCreate;
let dbUpdate;
let dbDelete;
let dbFind;
let resJsonSpy;
let resStatusSpy;
let resSendSpy;
let errSpy;

describe('Testing account related scenes', () => {

    beforeEach('create sandbox', () => {
        sandbox = sinon.sandbox.create();

        dbCreate = sandbox.stub(dataModel.account, "create");
        dbUpdate = sandbox.stub(dataModel.account, "findOneAndUpdate");
        dbDelete = sandbox.stub(dataModel.account, "remove");

        errSpy = sandbox.stub(errors, "errorHandler");
        resJsonSpy = sandbox.spy(fakeRes, 'json');
        resStatusSpy = sandbox.spy(fakeRes, 'status');
        resSendSpy = sandbox.spy(fakeRes, 'send');


    });
    afterEach('restore the sandbox', () => {
        sandbox.restore();
    });

    it('Testing account number generation', (done) => {
        let quantity = 5;

        let r = account.generateAccountNumber(quantity);

        assert.isArray(r);
        assert(r.length === quantity);
        assert.isString(r[0]);
        //the generated number should be 10 digits
        assert(r[0].length === 10);
        done();
    });

    it('Testing account creation while database writing is successful', (done) => {
        //simulate a success databse call
        dbCreate.resolves();

        account.createAccount(req, fakeRes);

        /*Mongoose's operation is asynchronous, run the assertion on the
         next cycle of the event loop.*/
        setTimeout(function () {
            assert(resJsonSpy.calledOnce, 'should return normal json reply once');
            done();
        }, 0);
    });

    it('Testing account creation while database writing is not successful and throws error', (done) => {
        //simulate a success databse call

        let err = {error: 'database error'};
        dbCreate.rejects(err);
        account.createAccount(req, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, err, 'controllers/account', 500, 'internal error').calledOnce,
                'should handle the error properly');

            done();
        }, 0);
    });
    
    it('Testing account updation while this account can not be found', (done) => {
        //simulate a success databse call, but account not found
        dbUpdate.resolves();

        account.updateAccount(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(404).calledOnce, 'should set status to 404 once');
            assert(resJsonSpy.calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing account updation while database writing is successful', (done) => {
        //simulate a success databse call, but account not found
        dbUpdate.resolves({fakeAccount: true});

        account.updateAccount(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(204).calledOnce, 'should set status to 404 once');
            assert(resSendSpy.calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing account updation while database writing is fail', (done) => {

        let err = {error: 'database error'};
        dbUpdate.rejects(err);

        account.updateAccount(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, err, 'controllers/account', 500, 'internal error').calledOnce,
                'should handle the error properly');
            done();
        }, 0);
    });


    it('Testing account deletion while this account can not be found', (done) => {
        //simulate a success databse call, but account not found
        dbDelete.resolves({result: {n: 0}});

        account.deleteAccount(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(404).calledOnce, 'should set status to 404 once');
            assert(resJsonSpy.calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing account deletion while database writing is successful', (done) => {

        dbDelete.resolves({result: {n: 1}});

        account.deleteAccount(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(204).calledOnce, 'should set status to 404 once');
            assert(resSendSpy.calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing account deletion while database writing is fail', (done) => {

        let err = {error: 'database error'};
        dbDelete.rejects(err);

        account.deleteAccount(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, err, 'controllers/account', 500, 'internal error').calledOnce,
                'should handle the error properly');
            done();
        }, 0);
    });

    it('Testing account query while force is not required (can read from cache)', (done) => {

        //simulate the cache has data
        let redisRead = sandbox.stub(redis, "getCache").resolves({data: 'fake data'});
        let redisWrite = sandbox.stub(redis, "setCache");

        account.getAccount(reqWithoutForce, fakeRes);

        setTimeout(function () {
            assert(resJsonSpy.withArgs({data: 'fake data'}).calledOnce, 'should set status to 404 once');
            done();
        }, 0);

    });

    it('Testing account query while force is not required (can read from cache), but redis does not have this query record', (done) => {

        //simulate the cache has no data
        let redisRead = sandbox.stub(redis, "getCache").resolves(false);
        let redisWrite = sandbox.stub(redis, "setCache");

        let dbFind = sandbox.stub(dataModel.account, "find").returns(fakeChain);

        account.getAccount(reqWithoutForce, fakeRes);

        setTimeout(function () {

            assert(resJsonSpy.withArgs({data: 'fake data'}).calledOnce, 'should set status to 404 once');
            assert(redisWrite.calledOnce);

            done();
        }, 0);

    });

    it('Testing account query while force is required (can not read from cache)', (done) => {

        let redisWrite = sandbox.stub(redis, "setCache");

        let dbFind = sandbox.stub(dataModel.account, "find").returns(fakeChain);

        account.getAccount(reqWithForce, fakeRes);

        setTimeout(function () {

            assert(resJsonSpy.withArgs({data: 'fake data'}).calledOnce, 'should set status to 404 once');
            assert(redisWrite.calledOnce);

            done();
        }, 0);

    });

    it('Testing account query while force is required (can not read from cache), but the database is throwing error', (done) => {

        let dbFind = sandbox.stub(dataModel.account, "find").returns(fakeChainReject);

        account.getAccount(reqWithForce, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, {error: 'database error'}, 'controllers/account', 500, 'internal error').calledOnce,
                'should handle the error properly');
            done();
        }, 0);

    });

});