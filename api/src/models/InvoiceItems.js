module.exports = (sequelize, DataTypes) => {
  return sequelize.define('invoiceItems', {
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
      type: DataTypes.DECIMAL(13, 2),
      allowNull: false,
      validate: {
        isNumeric: {
          args: true,
          msg: 'Invalid price.'
        }
      }
    }
  });
};
