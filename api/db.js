const Sequelize = require('sequelize');

const db = new Sequelize('invoicealot', 'root', 'ilash', { // TODO: get details from env/conf
    host: '127.0.0.1',
    dialect: 'mysql'
});

// test db connection
db
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = db;
