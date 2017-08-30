const sinon = require('sinon');
const assert = require('chai').assert;
const dataModel = require('../api/dataModel/dataModel');
const errors = require('../api/controllers/errorHandler');
const account = require('../api/controllers/account');
const client = require('../api/controllers/client');
const redis = require('../api/redis/redis');
const validator = require('../api/controllers/validator');

let sandbox;

let fakeRes = {
    name: 'fakeRes',
    json: function () {
    },
    send: function () {
    },
    status: function () {
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

let req = {
    swagger: {
        params: {
            form: {
                value: {
                    name: 'hello',
                    dob: '2017-08-30T04:10:50.255Z'
                }
            }
        }
    }
};

let reqWithPathId = {
    swagger: {
        params: {
            id: {
                value: '59a62d7c820b75b6840390bd'
            }
            ,
            form: {
                value: {
                    name: 'hello',
                    dob: '2017-08-30T04:10:50.255Z'
                }
            }
        }
    }
};

let reqClient = {
    swagger: {
        params: {
            name: {
                value: 'hello'
            },
            phone: {
                value: '1234567890'
            },
            minage: {
                value: '30'
            },
            maxage: {
                value: '50'
            },
            limit: {
                value: 5
            }
        }
    }
};

let reqWithAccountNumber = {
    swagger: {
        params: {
            accountNumber: {
                value: '1234567890'
            }
        }
    }
};

let reqWithAccounts = {
    swagger: {
        params: {
            form: {
                value: {
                    accounts: [{status: 'active', type: 'che'}],
                    name: 'hello'
                }
            }
        }
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


describe('Testing client related scenes', () => {
    beforeEach('create sandbox', () => {
        sandbox = sinon.sandbox.create();

        dbCreate = sandbox.stub(dataModel.client, "create");
        dbUpdate = sandbox.stub(dataModel.client, "findOneAndUpdate");
        dbDelete = sandbox.stub(dataModel.client, "remove");

        errSpy = sandbox.stub(errors, "errorHandler");
        resJsonSpy = sandbox.spy(fakeRes, 'json');
        resStatusSpy = sandbox.spy(fakeRes, 'status');
        resSendSpy = sandbox.spy(fakeRes, 'send');

    });
    afterEach('restore the sandbox', () => {
        sandbox.restore();
    });

    it('Testing getDateBefore function', (done) => {
        assert.instanceOf(new Date(client.getDateBefore(1)), Date,
            'should be able to convert to standard date string');
        done();
    });

    it('Testing client creation while database writing is successful', (done) => {
        //simulate a success databse call
        dbCreate.resolves({_id: 1});

        client.createClient(req, fakeRes);

        /*Mongoose's operation is asynchronous, run the assertion on the
         next cycle of the event loop.*/
        setTimeout(function () {
            assert(resJsonSpy.calledOnce, 'should return normal json reply once');
            done();
        }, 0);
    });

    it('Testing client creation while database writing throws error', (done) => {
        //simulate a success databse call

        let err = {error: 'database error'};
        dbCreate.rejects(err);
        client.createClient(req, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, err, 'controllers/client', 500, 'internal error').calledOnce,
                'should handle the error properly');

            done();
        }, 0);
    });

    it('Testing client updation while this account can not be found', (done) => {
        //simulate a success database call, but account not found
        dbUpdate.resolves();

        client.updateClient(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(404).calledOnce, 'should set status to 404 once');
            assert(resJsonSpy.calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing client updation when writing is successful', (done) => {
        //simulate a success databse call, but account not found
        dbUpdate.resolves({fakeClient: true});
        client.updateClient(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(204).calledOnce, 'should set status to 404 once');
            assert(resSendSpy.calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing client updation when database writing fails', (done) => {
        let err = {error: 'database error'};
        dbUpdate.rejects(err);
        client.updateClient(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, err, 'controllers/client', 500, 'internal error').calledOnce,
                'should handle the error properly');
            done();
        }, 0);
    });

    it('Testing client deletion while this client can not be found', (done) => {
        //simulate a success databse call, but account not found
        dbDelete.resolves({result: {n: 0}});
        client.deleteClient(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(404).calledOnce, 'should set status to 404 once');
            assert(resJsonSpy.calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing client deletion while database remove is successful', (done) => {

        dbDelete.resolves({result: {n: 1}});
        client.deleteClient(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(204).calledOnce, 'should set status to 404 once');
            assert(resSendSpy.calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing client deletion while database writing fails', (done) => {
        let err = {error: 'database error'};
        dbDelete.rejects(err);

        client.deleteClient(reqWithPathId, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, err, 'controllers/client', 500, 'internal error').calledOnce,
                'should handle the error properly');
            done();
        }, 0);
    });

    it('Testing client query is success', (done) => {
        let dbFind = sandbox.stub(dataModel.client, "find").returns(fakeChain);

        client.getClient(reqClient, fakeRes);

        setTimeout(function () {
            assert(resJsonSpy.withArgs({data: 'fake data'}).calledOnce, 'should return correct data from the database');
            done();
        }, 0);
    });

    it('Testing client query is not success', (done) => {
        let dbFind = sandbox.stub(dataModel.client, "find").returns(fakeChainReject);

        client.getClient(reqClient, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, {error: 'database error'}, 'controllers/client', 500, 'internal error').calledOnce,
                'should handle the error properly');
            done();
        }, 0);
    });

    it('Testing find client by account number successfully', (done) => {

        let dbFindOne = sandbox.stub(dataModel.client, "findOne").resolves({data: 'fake data'});
        let dbAccountFindOne = sandbox.stub(dataModel.account, "findOne").resolves({cid: '123'});

        client.findClientByAccount(reqWithAccountNumber, fakeRes);

        setTimeout(function () {
            assert(resJsonSpy.withArgs({data: 'fake data'}).calledOnce, 'should return correct data from the database');
            done();
        }, 0);
    });

    it('Testing find client by account number, but the account does not exist', (done) => {

        let dbAccountFindOne = sandbox.stub(dataModel.account, "findOne").resolves();

        client.findClientByAccount(reqWithAccountNumber, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(404).calledOnce, 'should set status to 404 once');
            assert(resJsonSpy.withArgs({message: 'account not found'}).calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing find client by account number, account exist but can not find any client related to this account', (done) => {

        let dbFindOne = sandbox.stub(dataModel.client, "findOne").resolves();
        let dbAccountFindOne = sandbox.stub(dataModel.account, "findOne").resolves({cid: '123'});

        client.findClientByAccount(reqWithAccountNumber, fakeRes);

        setTimeout(function () {
            assert(resStatusSpy.withArgs(404).calledOnce, 'should set status to 404 once');
            assert(resJsonSpy.withArgs({message: 'client not found'}).calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing find client by account number, and the query to database fails', (done) => {

        let err = {error: 'database error'};

        let dbFindOne = sandbox.stub(dataModel.client, "findOne").rejects(err);
        let dbAccountFindOne = sandbox.stub(dataModel.account, "findOne").resolves({cid: '123'});

        client.findClientByAccount(reqWithAccountNumber, fakeRes);

        setTimeout(function () {
            assert(errSpy.withArgs(fakeRes, err, 'controllers/client', 500, 'internal error').calledOnce,
                'should handle the error properly');
            done();
        }, 0);
    });

    it('Testing create client with list of accounts', (done) => {

        dbCreate.resolves({_id: 1});
        dbAccountCreate = sandbox.stub(dataModel.account, "create").resolves();

        client.createClientWithAccounts(reqWithAccounts, fakeRes);

        setTimeout(function () {
            assert(resJsonSpy.withArgs(1).calledOnce, 'should send http response once');
            done();
        }, 0);
    });

    it('Testing create client with list of accounts, the creation of account fail, need rollback', (done) => {

        let err = {error: 'database error'};
        dbCreate.resolves({_id: 1});
        let dbAccountCreate = sandbox.stub(dataModel.account, "create").rejects(err);

        let rollback = sandbox.stub(dataModel.client, "findByIdAndRemove");

        client.createClientWithAccounts(reqWithAccounts, fakeRes);

        setTimeout(function () {
            assert(rollback.withArgs(1).calledOnce, 'should rollback to remove the inserted client doc');
            assert(errSpy.withArgs(fakeRes, err, 'controllers/client', 500, 'internal error').calledOnce,
                'should handle the error properly');
            done();
        }, 0);
    });
});