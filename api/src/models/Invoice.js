module.exports = (sequelize, DataTypes) => {
  return sequelize.define('invoice', {
    number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: 'Invoice number is required.'
        }
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['invoice', 'estimate']],
          msg: 'Invalid invoice type.'
        }
      }
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          args: true,
          msg: 'Due date should be in the format YYYY-MM-DD.'
        }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        max: {
          args: 2048,
          msg: 'The notes text is too long.'
        }
      }
    },
    footer: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        max: {
          args: 1024,
          msg: 'The footer text is too long.'
        }
      }
    },
    state: {
      type: DataTypes.STRING,
      defaultValue: 'draft',
      allowNull: false,
      validate: {
        isIn: {
          args: [['saved', 'draft']],
          msg: 'Invalid invoice state.'
        }
      }
    }
  });
};
