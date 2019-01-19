module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organizationUsers', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      default: 'staff',
      validate: {
        isIn: {
          args: [['owner', 'staff']],
          msg: 'Invalid user level.'
        }
      }
    }
  });
};
