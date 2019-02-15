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

const OrganizationUserPermission = db.import('./src/models/OrganizationUserPermission');
const OrganizationUser = db.import('./src/models/OrganizationUser');
const Invoice = db.import('./src/models/Invoice');
const InvoiceItem = db.import('./src/models/InvoiceItem');
const Organization = db.import('./src/models/Organization');
const UserEmailVerification = db.import('./src/models/UserEmailVerification');
const UserEmail = db.import('./src/models/UserEmail');
const User = db.import('./src/models/User');

// Model associations
User.hasMany(UserEmail);
UserEmail.belongsTo(User);

UserEmailVerification.belongsTo(UserEmail);

User.belongsToMany(Organization, { through: OrganizationUser });
Organization.belongsToMany(User, { through: OrganizationUser });

Organization.hasMany(Invoice);
Invoice.belongsTo(Organization);

OrganizationUser.hasMany(OrganizationUserPermission);
Invoice.hasMany(InvoiceItem);
  
module.exports = db;
