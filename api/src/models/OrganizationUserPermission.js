module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organizationUserPermission', {
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
