node-redis-event
================

Distributed node.js event emitter based on redis pub/sub.

Supports channels (sort of namespaces). This code is heavily used 24x7 on a thousand-servers cluster, so it is production ready.

# SYNOPSIS

```javascript
const RedisEvent = require('redis-event');

const ev = new RedisEvent('redis-host', ['updates', 'stats']);

ev.on('ready', () => {
	ev.on('updates:server', data => {
		console.log("Host %s updated to %d", data.hostname, data.count);
	});

	ev.pub('updates:test', {
		launchedAt: new Date()
	});

	ev.pub('stats:date', {
		now: new Date()
	});

	ev.on('updates:shutdown', data => {
		ev.quit();
	});
});
```

## Installation

```
npm install redis-event
```

## API

### new RedisEvent(hostname, [channel, channel, channel...])

Initialise object.

__Arguments__

* `hostname` - redis hostname to connect to
* `channel` - name(s) of the redis pub/sub channel(s) to subscribe to

### redisEvent.pub(eventName, payload)

Emit network event.

__Arguments__

* `eventName` - event name in form of `channel:name`, eg. `server:stats`
* `payload` - optional JS object to add to the event. Must be serializable to JSON

### redisEvent.on(eventName, function(payload))

Subscribe to network event. Special case: `ready` event (see below).

__Arguments__

* `eventName` - event name in form of `channel:name`, eg. `server:stats`
* `payload` - optional JS object that was added to event

### redisEvent.on('ready')

This event is emitted when redis-event has successfully connected to both redis sub and pub channels. You will want to emit events only after this event is fired. If also can be fired multiple times in case there was a reconnect.

### redisEvent.quit()

Disconnect from redis. This is actually useful to quit node application.

## TODO

* Encryption

