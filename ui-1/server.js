/*==================================================
  Modules
  ==================================================*/

  const express = require("express");
  const bodyParser = require("body-parser");
  const cors = require('cors');
  const path = require('path');

  var services = require('./services.js');

/*==================================================
  Setup
  ==================================================*/

  var app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  var ui = express()
  var api = express()

  ui.use(express.static(path.join(__dirname, 'build')));

  app.use('/', ui);
  app.use('/api', api)

  var server = app.listen(process.env.PORT, function () {
    server.keepAliveTimeout = 200000;
    server.timeout = 100000;
    console.log("Listening on port: ", server.address().port);
  });

/*==================================================
  API Routes
  ==================================================*/

  api.get('/risk', async function (req, res) {
    try {
      res.writeHead(200, {
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff'
      });

      var chunk = 0;

      function SendChunk(data) {
        res.write(JSON.stringify({chunk, data}) + '\n')
        chunk++;
      }

      var risk = await services.GetRisk(req.query, (data) => {
        SendChunk({update: data})
      })

      SendChunk(risk)
      res.end()
    } catch(error) {
      console.log(error)
      res.status(500).send()
    }
  });

  // keep this, app must respond with a 200 status at /api/test/ping for monitoring and scaling of the deployment
  api.get('/test/ping', function (req, res) {
    res.send('pong');
  });
