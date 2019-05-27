module.exports = (sequelize, DataTypes) => {
  return sequelize.define('userTransaction', {
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: 'Invalid amount.'
        },
        notEmpty: {
          args: true,
          msg: 'Invalid amount.'
        }
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
};
