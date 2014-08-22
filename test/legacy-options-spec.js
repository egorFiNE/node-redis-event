var RedisEvent = require('../index.js');

var assert = require('chai').assert;

describe("LegacyOptions#", function() {

	it("should accept host as a first option and channels list as a second", function(done) {
		var ev = new RedisEvent('localhost', ['main']);
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