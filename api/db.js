const Sequelize = require('sequelize');
const { to } = require('./src/utils/helpers');

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  // logging: false
});

// test db connection
// TODO: make this blocking
db
  .authenticate()
  .then(() => {
      console.log('Connection has been established successfully.');
  })
  .catch(err => {
      console.error('Unable to connect to the database:', err);
  });

const OrganizationUserPermissions = db.import('./src/models/OrganizationUserPermissions');
const OrganizationUsers = db.import('./src/models/OrganizationUsers');
const Invoice = db.import('./src/models/Invoice');
const InvoiceItems = db.import('./src/models/InvoiceItems');
const Organization = db.import('./src/models/Organization');
const UserEmailVerifications = db.import('./src/models/UserEmailVerifications');
const UserEmails = db.import('./src/models/UserEmails');
const User = db.import('./src/models/User');

// Model associations
User.hasMany(UserEmails);
UserEmails.belongsTo(User);

UserEmailVerifications.belongsTo(UserEmails);

User.belongsToMany(Organization, { through: OrganizationUsers });
Organization.belongsToMany(User, { through: OrganizationUsers });

Organization.hasMany(Invoice);
Invoice.belongsTo(Organization);

OrganizationUsers.hasMany(OrganizationUserPermissions);
Invoice.hasMany(InvoiceItems);
  
module.exports = db;
