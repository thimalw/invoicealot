const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

// init express
const app = express();

// import models for sync
const User = db.import(__dirname + '/src/models/User');

// sync db
db.sync().then(() => {
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // init routes
  app.use('/v1', require('./src/routes'));

  // TODO: get port from config/env
  // start server
  app.listen(3000, () => {
    console.log('Server is listening on port 3000');
  });
});
