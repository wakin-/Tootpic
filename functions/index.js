'use strict';

var functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const request = require('request');

exports.nicoScript = functions.https.onRequest((request, response) => {
    var id = request.query.id;
    var script = '<html><head></head><body><script type="application/javascript" src="https://embed.nicovideo.jp/watch/sm'+id+'/script?w=400&h=205"></script></body>';
    response.setHeader('Content-Type', 'text/html');
    response.send(script);
});