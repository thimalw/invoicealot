module.exports = (sequelize, DataTypes) => {
  return sequelize.define('userEmailVerifications', {
    hash: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
