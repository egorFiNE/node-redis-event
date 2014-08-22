var
	util = require('util'),
	events = require('events'),
	crypto = require('crypto'),
	redis = require('redis');

function RedisEvent(channelsList, options) {
	events.EventEmitter.call(this);

	if (options instanceof Array && typeof channelsList === "string") {
		// Legacy support for when 'channelsList' was a second parameter and 'hostname' first
		var tmp = options;
		options = {
			host: channelsList
		};
		channelsList = tmp;
	}

	this._options = options || {};

	var self = this;

	this._connectedCount = 0;

	if (!channelsList || !(channelsList instanceof Array) || channelsList.length === 0) {
		throw new Error("No channels specified to RedisEvent");
	}

	this.channelsList = channelsList;

	this.pubRedis = redis.createClient(
		this._options.port || 6379, this._options.host || '127.0.0.1', {
			enable_offline_queue: false,
			retry_max_delay: 10000,
			max_attempts: 10000,
			no_ready_check: true
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
		this._options.port || 6379, this._options.host || '127.0.0.1', {
			enable_offline_queue: false,
			retry_max_delay: 10000,
			max_attempts: 10000,
			no_ready_check: true
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
		self.subRedis.subscribe( self._encryptChannelName(channelName) );
	});
};

RedisEvent.prototype._onMessage = function(channel, message) {
	var data = null, eventName = null;
	try {
		data = this._unpackMessage(message);
		if (data && data.event) {
			eventName = this._decryptChannelName(channel) + ':' +data.event;
		}
	} catch(e) {
		console.log("Error unpacking message:", e)
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

	this.pubRedis.publish( this._encryptChannelName(split[0]), this._packMessage(data), function(){});
};

RedisEvent.prototype.quit = function() {
	this.subRedis.quit();
	this.pubRedis.quit();
};

RedisEvent.prototype._packMessage = function(data) {
	var string = JSON.stringify(data);

	return this._encrypt(string);
};

RedisEvent.prototype._unpackMessage = function(string) {
	string = this._decrypt(string);

	return JSON.parse(string);
};

RedisEvent.prototype._encrypt = function(string) {
	if (this._options.password) {
		var cipher = crypto.createCipher('aes-256-cbc', this._options.password);

	    var encrypted = cipher.update(string, 'utf8', 'base64');
	    encrypted += cipher.final('base64');

	    return encrypted;
	} else {
		return string;
	}
};

RedisEvent.prototype._decrypt = function(string) {
	if (this._options.password) {
		var cipher = crypto.createDecipher('aes-256-cbc', this._options.password);

	    var decrypted = cipher.update(string, 'base64', 'utf8');
	    decrypted += cipher.final('utf8');

	    return decrypted;
	} else {
		return string;
	}
};

RedisEvent.prototype._encryptChannelName = function(channelName) {
	if (this._options.password) {
		var hash = crypto.createHash('sha1').update(this._options.password).digest('hex');
		return channelName + '.' + hash;
	} else {
		return channelName;
	}
};

RedisEvent.prototype._decryptChannelName = function(channelName) {
	if (this._options.password) {
		var dotIdx = channelName.indexOf('.');
		if (dotIdx) {
			return channelName.substring(0, dotIdx);
		} else {
			return channelName;
		}
	} else {
		return channelName;
	}
};

module.exports = RedisEvent;
