module.exports = (sequelize, DataTypes) => {
  return sequelize.define('invoice', {
    number: {
      type: DataTypes.STRING,
      allowNull: false
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
      allowNull: false,
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
      default: 'draft',
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
