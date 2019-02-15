module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organizationUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'staff',
      validate: {
        isIn: {
          args: [['owner', 'staff']],
          msg: 'Invalid user role.'
        }
      }
    }
  });
};
