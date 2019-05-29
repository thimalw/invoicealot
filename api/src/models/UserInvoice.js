module.exports = (sequelize, DataTypes) => {
  return sequelize.define('userInvoice', {
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: '-2',
      allowNull: false
    }
  });
};
