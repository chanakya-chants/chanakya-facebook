var _ = require('lodash'),
  express = require('express'),
  server = express(),
  bodyParser = require('body-parser'),
  https = require('https'),
  path = require('path'),
  C = require('chanakya');

var chatSession = {};

server.set('port', (process.env.PORT || 3000));

server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());
server.use('/img', express.static(__dirname + '/img'));

server.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../../public', 'index.html'));
});

server.get('/mi.png', function (req, res) {
  res.sendFile(path.join(__dirname, '../../public', 'mi.png'));
});

server.get('/webhook', function (req, res) {
  console.log('get webhook' + req.query['hub.verify_token']);
  if (req.query['hub.verify_token'] === app.token) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong validation token');
  }
});

server.post('/webhook/', function (req, res) {

  messaging_events = req.body.entry[0].messaging;

  for (i = 0; i < messaging_events.length; i++) {
    var event = req.body.entry[0].messaging[i];
    var sender = event.sender.id;

    if (_.isUndefined(chatSession[sender])) {
      https.get('https://graph.facebook.com/v2.6/' + sender + '?access_token=' + app.token, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (d) {
          d = JSON.parse(d);
          d.id = sender;
          d.expectation = app.expectation;
          chatSession[sender] = _.clone(d);
          C.handleMessage(event, chatSession[sender]);
        });
      }).on('error', function (e) {
        console.error(e);
      });
    } else {
      C.handleMessage(event, chatSession[sender]);
    }
  }
  res.sendStatus(200);
});

server.listen(server.get('port'), function () {
  console.log('Node server is running on port', server.get('port'));
});
