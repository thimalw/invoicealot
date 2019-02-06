module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organization', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: 'Organization name is required.'
        },
        len: {
          args: [1, 100],
          msg: 'Organization name must be between 1 to 100 characters.'
        }
      }
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          args: true,
          msg: 'Invalid organization logo.'
        }
      }
    }
  });
};
