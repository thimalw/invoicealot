require('dotenv').config();
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

  app.listen(process.env.PORT, () => {
    console.log('Server is listening on port ' + process.env.PORT);
  });
});
