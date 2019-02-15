module.exports = (sequelize, DataTypes) => {
  return sequelize.define('userEmail', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'There\'s an account already associated with this email.'
      },
      validate: {
        isEmail: {
          args: true,
          msg: 'Email format is invalid.'
        },
        notEmpty: {
          args: true,
          msg: 'Email is required.'
        }
      }
    },
    primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: {
        isInt: {
          args: true,
          msg: 'Invalid request.'
        }
      }
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: '0',
      validate: {
        isInt: {
          args: true,
          msg: 'Invalid request.'
        }
      }
    }
  });
};
