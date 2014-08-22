var RedisEvent = require('../index.js');

var assert = require('chai').assert;

describe("Encryption#", function() {

	it("should send and receive encrypted event", function(done) {
		var ev = new RedisEvent(['main'], {
			password: 'password'
		});
		ev.on('ready', function() {
			ev.on('main:hello', function(data) {
				assert.deepEqual(data, {name: 'vasya'});
				ev.quit();
				return done();
			});

			ev.pub('main:hello', {name: 'vasya'});
		});
	});

	it("encrypted event shouldn't be received by unencrypted client", function(done) {
		var encrypted = new RedisEvent(['main'], {
			password: 'password'
		});
		var unencrypted = new RedisEvent(['main'], {});

		var readyCount = 0;
		encrypted.on('ready', function() {
			readyCount++;
			if (readyCount === 2) {
				sendEvent();
			}
		});
		unencrypted.on('ready', function() {
			readyCount++;
			if (readyCount === 2) {
				sendEvent();
			}
		});

		function sendEvent() {
			unencrypted.on('main:hello', function(data) {
				unencrypted.quit();
				return done(new Error("Unencrypted client received a message!"));
			});

			encrypted.pub('main:hello', {name: 'vasya'});
			encrypted.quit();

			setTimeout(function() {
				unencrypted.quit();
				done();
			}, 1000); // We can't really know when client "didn't receive a message", so we assume it should have received it during 1 second
		}
	});
});
