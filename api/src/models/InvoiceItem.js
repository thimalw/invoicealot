module.exports = (sequelize, DataTypes) => {
  return sequelize.define('invoiceItem', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          args: true,
          msg: 'Quantity is invalid.'
        }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: 'Invalid price.'
        },
        notEmpty: {
          args: true,
          msg: 'Invalid price.'
        }
      }
    }
  });
};
