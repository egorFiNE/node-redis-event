node-redis-event
================

Distributed node.js event emitter based on redis pub/sub. 

Supports channels (sort of namespaces). 

# SYNOPSIS

```javascript
var RedisEvent = require('../index.js');

var ev = new RedisEvent('redis-host', ['updates', 'stats']);
ev.on('ready', function() {
	ev.on('updates:server', function(data) {
		console.log("Host %s updated to %d", data.hostname, data.count);
	});

	ev.pub('updates:test', { 
		launchedAt: new Date() 
	});

	ev.pub('stats:date', { 
		now: new Date() 
	});

	ev.on('updates:shutdown', function(data) {
		ev.quit();
	});
});
```

## API

### new RedisEvent(hostname, [channel, channel, channel...])

Initialise object. 

__Arguments__

* hostname - redis hostname to connect to
* channel - name(s) of the redis pub/sub channel(s) to subscribe to

### redisEvent.pub(eventName, payload) 

Emit network event. 

__Arguments__

* eventName - event name in form of `channel:name`, eg. `server:stats`
* payload - optional JS object to add to the event. Must be serializable to JSON

### redisEvent.on(eventName, function(payload)) 

Subscribe to network event. 

__Arguments__

* eventName - event name in form of `channel:name`, eg. `server:stats`
* payload - optional JS object that was added to event

### redisEvent.quit()

Disconnect from redis. 

## TODO

* Encryption

