module.exports = (sequelize, DataTypes) => {
  return sequelize.define('userCard', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
