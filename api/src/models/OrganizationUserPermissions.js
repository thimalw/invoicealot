module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organizationUserPermissions', {
    permission: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['invoice.create', 'invoice.delete', 'customer.create', 'customer.delete']],
          msg: 'Invalid permission.'
        }
      }
    }
  });
};
