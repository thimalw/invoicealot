module.exports = (sequelize, DataTypes) => {
  return sequelize.define('userEmailVerification', {
    token: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
