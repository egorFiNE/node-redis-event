node-redis-event
================

Distributed node.js event emitter based on redis pub/sub.

SYNOPSIS
========

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

