module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organizationPlan', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
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
    },
    cycle: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'm'
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    active: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: '1'
    }
  });
};
