var RedisEvent = require('../index.js');

var assert = require('chai').assert;

describe("Options#", function() {
	it("should require channels list option", function() {
		assert.throw(function() {
			new RedisEvent();
		});
	});

	it("should require channels list option to be an array", function() {
		assert.throw(function() {
			new RedisEvent({host: '127.0.0.1'});
		});
	});

	it("should require channels list option to be not empty array", function() {
		assert.throw(function() {
			new RedisEvent([]);
		});
	});
});