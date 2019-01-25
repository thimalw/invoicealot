module.exports = (sequelize, DataTypes) => {
  return sequelize.define('userEmailVerifications', {
    token: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
