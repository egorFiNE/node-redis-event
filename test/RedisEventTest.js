var RedisEvent = require('../index.js');


exports['main'] = function(test) { 
	var ev = new RedisEvent('localhost', ['main']);
	ev.on('ready', function() {
		ev.on('main:hello', function(data) {
			test.deepEqual(data, {name: 'vasya'});
			ev.quit();
			test.done();
		});

		ev.pub('main:hello', {name: 'vasya'});
	});
}
