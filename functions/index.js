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

exports.scScript = functions.https.onRequest((req, res) => {
    var url = "http://soundcloud.com/oembed?format=json&url="+req.query.url+"&maxheight=81";
    console.log(url);
    cors(req, res, () => {
        request({
            url: url,
        }, function (error, response, body) {
            console.log(error);
            console.log(response);
            console.log(body);
            var html = "";
            if (!error && response.statusCode == 200) {
                html = '<html><head></head><body>'+JSON.parse(body)+'</body>';
            }
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        });
    });
});