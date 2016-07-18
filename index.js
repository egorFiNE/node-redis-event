var
	util = require('util'),
	events = require('events'),
	redis = require('redis');

function RedisEvent(host, channelsList) {
	events.EventEmitter.call(this);

	var self=this;

	self._connectedCount=0;

	if (!channelsList || channelsList.length === 0) {
		throw new Error("No channels specified to RedisEvent");
	}

	if (!host) {
		throw new Error("No hostname specified to RedisEvent");
	}

	this.channelsList = channelsList;

	this.pubRedis = redis.createClient(
		6379, host, {
			enable_offline_queue: false,
			no_ready_check: true,
			retry_strategy: function (options) {
				return 3000 + Math.round(Math.random() * 3000);
			}
		}
	);
	this.pubRedis.on('error', function(e){ console.log(e); });
	this.pubRedis.on('ready', function() {
		self._connectedCount++;
		if (self._connectedCount == 2) {
			self.emit('ready');
		}
	});
	this.pubRedis.on('end', function() {self._connectedCount--; });

	this.subRedis = redis.createClient(
		6379, host, {
			enable_offline_queue: false,
			no_ready_check: true,
			retry_strategy: function (options) {
				return 3000 + Math.round(Math.random() * 3000);
			}
		}
	);
	this.subRedis.on('error', function(e){ console.log(e); });
	this.subRedis.on('ready', function() {
		self._connectedCount++;
		self._subscribe();
		if (self._connectedCount == 2) {
			self.emit('ready');
		}
	});
	this.subRedis.on('end', function() {self._connectedCount--; });

	this.subRedis.on("message", this._onMessage.bind(this));
}
util.inherits(RedisEvent, events.EventEmitter);

RedisEvent.prototype._subscribe = function() {
	var self=this;
	this.channelsList.forEach(function(channelName) {
		self.subRedis.subscribe(channelName);
	});
};

RedisEvent.prototype._onMessage = function(channel, message) {
	var data = null, eventName = null;
	try {
		data = JSON.parse(message);
		if (data && data.event) {
			eventName = channel + ':' +data.event;
		}
	} catch(e) {
	}

	if (data && eventName) {
		this.emit(eventName, data.payload);
	}
};

RedisEvent.prototype.pub = function(eventName, payload) {
	var split = eventName.split(':');
	if (split.length!=2) {
		console.log("ev warning: eventName '%s' is incorrect", eventName);
		return false;
	}

	var data = {
		event: split[1],
		payload: payload
	};

	this.pubRedis.publish(split[0], JSON.stringify(data), function(){});
};

RedisEvent.prototype.quit = function() {
	this.subRedis.quit();
	this.pubRedis.quit();
};

module.exports = RedisEvent;
