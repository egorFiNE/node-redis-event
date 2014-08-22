var RedisEvent = require('../index.js');

var assert = require('chai').assert;

describe("Events#", function() {

	it("should send and receive event", function(done) {
		var ev = new RedisEvent(['main']);
		ev.on('ready', function() {
			ev.on('main:hello', function(data) {
				assert.deepEqual(data, {name: 'vasya'});
				ev.quit();
				return done();
			});

			ev.pub('main:hello', {name: 'vasya'});
		});
	});
});
