module.exports = (sequelize, DataTypes) => {
  return sequelize.define('organizationPlanFeature', {
    feature: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });
};
