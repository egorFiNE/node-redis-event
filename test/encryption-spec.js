var RedisEvent = require('../index.js');

var assert = require('chai').assert;

describe("Encryption#", function() {

	it("should send and receive encrypted event", function(done) {
		var ev = new RedisEvent(['channel'], {
			password: 'password'
		});
		ev.on('ready', function() {
			ev.on('channel:hello', function(data) {
				assert.deepEqual(data, {name: 'vasya'});
				ev.quit();
				return done();
			});

			ev.pub('channel:hello', {name: 'vasya'});
		});
	});

	it("encrypted event shouldn't be received by unencrypted client", function(done) {
		var encrypted = new RedisEvent(['channel'], {
			password: 'password'
		});
		var unencrypted = new RedisEvent(['channel'], {});

		checkTwoClientsNotCommunicate(encrypted, unencrypted, 'channel:event', 'channel:event', done);
	});

	it("encrypted event shouldn't be received by unencrypted client even if it knows channel name", function(done) {
		var encrypted = new RedisEvent(['channel'], {
			password: 'password'
		});

		// Don't want to use implementation deatails, but didn't figure out how to do it otherwise
		var encryptedChannelName = encrypted._encryptChannelName('channel');

		var unencrypted = new RedisEvent([encryptedChannelName], {});

		checkTwoClientsNotCommunicate(encrypted, unencrypted, 'channel:event', encryptedChannelName + ':event', done);
	});

	it("encrypted event shouldn't be received by client with another password", function(done) {
		var client1 = new RedisEvent(['channel'], {
			password: 'password'
		});
		var client2 = new RedisEvent(['channel'], {
			password: 'password2'
		});

		checkTwoClientsNotCommunicate(client1, client2, 'channel:event', 'channel:event', done);
	});

	function checkTwoClientsNotCommunicate(client1, client2, channel1, channel2, done) {
		var readyCount = 0;
		client1.on('ready', function() {
			readyCount++;
			if (readyCount === 2) {
				sendEvent();
			}
		});
		client2.on('ready', function() {
			readyCount++;
			if (readyCount === 2) {
				sendEvent();
			}
		});

		function sendEvent() {
			client2.on(channel2, function(data) {
				client2.quit();
				return done(new Error("client2 received a message!"));
			});

			client1.pub(channel1, {key: 'value'});
			client1.quit();

			// We can't really know when client "didn't receive a message",
			// so we assume it should have received it during 1 second
			setTimeout(function() {
				client2.quit();
				done();
			}, 1000);
		}
	}
});
