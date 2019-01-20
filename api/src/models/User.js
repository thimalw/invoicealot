const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('user', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
          notEmpty: {
            args: true,
            msg: 'First name is required.'
          },
          len: {
            args: [1, 60],
            msg: 'First name must be between 1 to 60 characters.'
          }
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: 'Last name is required.'
        },
        len: {
          args: [1, 60],
          msg: 'Last name must be between 1 to 60 characters.'
        }
      }
    },
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
    password: {
      type: DataTypes.STRING(2048),
      allowNull: false,
      validate: {
        len: {
          args: [8, 64],
          msg: 'Password must be longer than 8 characters.'
        },
        notEmpty: {
          args: true,
          msg: 'Password is required.'
        }
      }
    }
  }, {
    hooks: {
      afterValidate: function(user) {
        user.password = bcrypt.hashSync(user.password, 8);
      }
    }
  });
};
