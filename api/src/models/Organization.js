module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organization', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
