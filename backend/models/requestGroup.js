module.exports = (sequelize, DataTypes) => {
    const RequestGroup = sequelize.define('RequestGroup', {
      request_group_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        index: true,
      },
      staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        index: true,
      },
      request_created_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      timestamps: false,
      tableName: 'request_groups',
    });

    RequestGroup.associate = function(models) {
      RequestGroup.hasMany(models.ArrangementRequest, {
        foreignKey: 'request_group_id',
        as: 'ArrangementRequest'
      });
    };
    
  
    return RequestGroup;
  };
  