var apiai = require('apiai');

var app = apiai("967dbdfd8bb842008ecf3008bb3a748c");

var request = app.textRequest('lớn Trần Cao Vân', {
    sessionId: '1234'
});

request.on('response', function(response) {
    console.log('response', response);
});

request.on('error', function(error) {
    console.log('error', error);
});

request.end();