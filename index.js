'use strict';

const
	EventEmitter = require('events'),
	redis = require('redis');

class RedisEvent extends EventEmitter {
	constructor(host, channelsList) {
		super();

		this._connectedCount=0;

		if (!channelsList || channelsList.length === 0) {
			throw new Error("No channels specified to RedisEvent");
		}

		if (!host) {
			throw new Error("No hostname specified to RedisEvent");
		}

		this.channelsList = channelsList;

		this.pubRedis = redis.createClient(
			6379, host, {
				return_buffers: false,
				detect_buffers: false,
				socket_keepalive: true,
				enable_offline_queue: false,
				retry_unfulfilled_commands: false,
				no_ready_check: true,
				retry_strategy: () => (3000 + Math.round(Math.random() * 3000))
			}
		);

		this.pubRedis.on('error', e => {
			console.log(e);
		});

		this.pubRedis.on('ready', () => {
			this._connectedCount++;
			if (this._connectedCount == 2) {
				this.emit('ready');
			}
		});

		this.pubRedis.on('end', () => {
			this._connectedCount--;
		});

		this.subRedis = redis.createClient(
			6379, host, {
				return_buffers: false,
				detect_buffers: false,
				socket_keepalive: true,
				enable_offline_queue: false,
				retry_unfulfilled_commands: false,
				no_ready_check: true,
				retry_strategy: () => (3000 + Math.round(Math.random() * 3000))
			}
		);

		this.subRedis.on('error', e => {
			console.log(e);
		});

		this.subRedis.on('ready', () => {
			this._connectedCount++;

			this._subscribe();

			if (this._connectedCount == 2) {
				this.emit('ready');
			}
		});

		this.subRedis.on('end', () => {
			this._connectedCount--;
		});

		this.subRedis.on("message", this._onMessage.bind(this));
	}

	_subscribe() {
		this.channelsList.forEach(channelName => {
			this.subRedis.subscribe(channelName);
		});
	}

	_onMessage(channel, message) {
		let data = null, eventName = null;
		try {
			data = JSON.parse(message);
			if (data && data.event) {
				eventName = channel + ':' +data.event;
			}
		} catch(e) {
			// ignore
		}

		if (data && eventName) {
			this.emit(eventName, data.payload);
		}
	}

	pub(eventName, payload) {
		const split = eventName.split(':');
		if (split.length != 2) {
			console.log("ev warning: eventName '%s' is incorrect", eventName);
			return false;
		}

		const data = {
			event: split[1],
			payload: payload
		};

		this.pubRedis.publish(split[0], JSON.stringify(data), () => {});
		return true;
	}

	quit() {
		this.subRedis.quit();
		this.pubRedis.quit();
	}
}

module.exports = RedisEvent;
