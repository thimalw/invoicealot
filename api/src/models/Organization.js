const Sequelize = require('sequelize');
const { to } = require('../utils/helpers');

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
    },
    paymentDue: {
      type: DataTypes.DATEONLY,
      defaultValue: Sequelize.NOW,
      allowNull: false,
      validate: {
        isDate: {
          args: true,
          msg: 'Invalid organization data.'
        }
      }
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: '-2',
      validate: {
        isInt: {
          args: true,
          msg: 'Invalid organization status code.'
        },
        notEmpty: {
          args: true,
          msg: 'Invalid organization status code.'
        }
      }
    }
  }, {
    hooks: {
      afterValidate: async (organization) => {
        const OrganizationPlan = sequelize.models.organizationPlan;
        
        let err, organizationPlan;
        [err, organizationPlan] = await to(OrganizationPlan.findOne({
          where: {
            id: organization.organizationPlanId,
            active: 1
          }
        }));

        if (err) {
          throw err;
        } else if (!organizationPlan) {
          throw {
            errors: [{
              validatorKey: 'allFields',
              path: 'allFields',
              message: 'Invalid plan.'
            }]
          };
        } else if (organizationPlan.stock == '0') {
          throw {
            errors: [{
              validatorKey: 'allFields',
              path: 'allFields',
              message: 'Sorry, the plan you have selected is out of stock.'
            }]
          };
        }
      }
    }
  });
};
