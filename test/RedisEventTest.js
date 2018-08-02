const assert = require('assert');
const RedisEvent = require('../index.js');

const STRUCTURE = { name: 'jane' };

const redisEvent = new RedisEvent('localhost', ['main']);

describe('RedisEvent', () => {
	it('should emit the very same structure that has been pub\'d', done => {
		redisEvent.on('main:hello', function(data) {
			assert.equal(JSON.stringify(data), JSON.stringify(STRUCTURE));
			redisEvent.quit();
			done();
		});

		redisEvent.pub('main:hello', STRUCTURE);
	});
});
