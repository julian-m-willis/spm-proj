module.exports = (sequelize, DataTypes) => {
  const ArrangementRequest = sequelize.define('ArrangementRequest', {
    arrangement_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      index: true,
    },
    session_type: DataTypes.STRING,
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true,
    },
    description: DataTypes.TEXT,
    request_status: DataTypes.STRING,
    updated_at: DataTypes.DATE,
    approval_comment: DataTypes.TEXT,
    approved_at: DataTypes.DATE,
    request_group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      index: true,
    },
  }, {
    timestamps: false,
    tableName: 'arrangement_requests',
  });

  return ArrangementRequest;
};
