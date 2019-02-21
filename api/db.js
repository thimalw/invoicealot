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

const Invoice = db.import('./src/models/Invoice');
const InvoiceItem = db.import('./src/models/InvoiceItem');
const OrganizationUserPermission = db.import('./src/models/OrganizationUserPermission');
const OrganizationUser = db.import('./src/models/OrganizationUser');
const OrganizationPlan = db.import('./src/models/OrganizationPlan');
const UserCard = db.import('./src/models/UserCard');
const UserTransaction = db.import('./src/models/UserTransaction');
const Organization = db.import('./src/models/Organization');
const UserEmailVerification = db.import('./src/models/UserEmailVerification');
const UserEmail = db.import('./src/models/UserEmail');
const UserInvoiceItem = db.import('./src/models/UserInvoiceItem');
const UserInvoice = db.import('./src/models/UserInvoice');
const User = db.import('./src/models/User');

// Model associations
User.hasMany(UserEmail);
UserEmail.belongsTo(User);

User.hasMany(UserInvoice);
UserInvoice.belongsTo(User);
Organization.hasMany(UserInvoice);
UserInvoice.belongsTo(Organization);
UserInvoice.hasMany(UserInvoiceItem);
UserInvoiceItem.belongsTo(UserInvoice);

UserEmailVerification.belongsTo(UserEmail);

User.belongsToMany(Organization, { through: OrganizationUser });
Organization.belongsToMany(User, { through: OrganizationUser });

OrganizationPlan.hasMany(Organization);
Organization.belongsTo(OrganizationPlan);

User.hasMany(UserCard);
UserCard.belongsTo(User);

User.hasMany(UserTransaction);
UserTransaction.belongsTo(User);

Organization.hasMany(Invoice);
Invoice.belongsTo(Organization);

OrganizationUser.hasMany(OrganizationUserPermission);
Invoice.hasMany(InvoiceItem);
InvoiceItem.belongsTo(Invoice);
  
module.exports = db;
