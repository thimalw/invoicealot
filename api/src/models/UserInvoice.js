module.exports = (sequelize, DataTypes) => {
  return sequelize.define('userInvoice', {
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          args: true,
          msg: 'Due date should be in the format YYYY-MM-DD.'
        }
      }
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: '-2',
      allowNull: false,
      validate: {
        isIn: {
          args: [['-2', '-1', '0', '1', '2']],
          msg: 'Invalid invoice status.'
        }
      }
    }
  });
};
