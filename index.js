(function() {
  var _ = require('lodash'),
      express = require('express'),
      server = express(),
      bodyParser = require('body-parser'),
      https = require('https'),
      path = require('path'),
      C = require('chanakya'),
      JSONbig = require('json-bigint');

  var fb = {};

  fb.init = function(app) {
    server.set('port', (process.env.PORT || 3000));

    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.text({ type: 'application/json' }));

    server.get('/', function(req, res) {
      res.sendFile(path.join(__dirname, '../../public', 'index.html'));
    });

    server.get('/mi.png', function(req, res) {
      res.sendFile(path.join(__dirname, '../../public', 'mi.png'));
    });

    server.get('/webhook', function(req, res) {
      console.log('get webhook' + req.query['hub.verify_token']);
      if (req.query['hub.verify_token'] === app.token) {
        res.send(req.query['hub.challenge']);
      } else {
        res.send('Error, wrong validation token');
      }
    });

    server.post('/webhook/', function(req, res) {

      var body = JSONbig.parse(req.body);

      _.each(body.entry[0].messaging, function(event) {
        var sender = event.sender.id.toString();
        var chatSession = C.getSession(sender);

        if (_.isUndefined(chatSession)) {
          https.get('https://graph.facebook.com/v2.6/' + sender + '?access_token=' + app.token, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(d) {
              d = JSON.parse(d);
              d.id = sender;
              d.expectation = app.expectation;
              chatSession = _.clone(d);
              C.setSession(chatSession);
              C.handleMessage(event, chatSession);
            });
          }).on('error', function(e) {
            console.error(e);
          });
        } else {
          C.handleMessage(event, chatSession);
        }
      });

      res.sendStatus(200);
    });

    server.listen(server.get('port'), function() {
      console.log('Node server is running on port', server.get('port'));
    });
  };

  module.exports = fb;

}());
