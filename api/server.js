const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();

db.sync({ force: false }).then(() => {
  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use('/v1', require('./src/routes'));

  // TODO: get port from config/env
  app.listen(3000, () => {
    console.log('Server is listening on port 3000');
  });
});
