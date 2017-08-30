const redis = require('../api/redis/redis');
const sinon = require('sinon');
const assert = require('chai').assert;

describe('Testing redis related scenes', () => {

    let redisSet;
    let sandbox;

    beforeEach('create sandbox', () => {
        sandbox = sinon.sandbox.create();
        redisSet = sandbox.stub(redis.redisclient, "set");

    });
    afterEach('restore the sandbox', () => {
        sandbox.restore();
    });

    it('Testing set cache', (done) => {
        redis.setCache('key', 'value');
        assert(redisSet.withArgs('query:key', 'value', 'EX', 5 * 60));
        done();
    });

});
