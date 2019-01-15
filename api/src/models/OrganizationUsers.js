module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organizationUsers', {
    role: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
