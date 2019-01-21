module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organizationUserPermissions', {
    permission: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['invoice', 'user', 'customer', 'products']],
          msg: 'Invalid permission.'
        }
      }
    }
  });
};
