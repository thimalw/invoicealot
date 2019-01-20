module.exports = (sequelize, DataTypes) => {
  return sequelize.define('invoiceItems', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          args: true,
          msg: 'Item name is required.'
        }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          args: true,
          msg: 'Quantity is required is required.'
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
        },
        notNull: {
          args: true,
          msg: 'Price is required.'
        }
      }
    }
  });
};
