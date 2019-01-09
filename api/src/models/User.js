const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('user', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
          len: [1, 30]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 30]
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
        isEmail: true
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
        notEmpty: true
      }
    }
  }, {
    hooks: {
      afterValidate: function(user) {
        user.password = bcrypt.hashSync(user.password, 8);
      }
    }
  });
}
