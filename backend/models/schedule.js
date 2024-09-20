module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define('Schedule', {
    schedule_id: {
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
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true,
    },
    session_type: {
      type: DataTypes.STRING,
    },
    description: DataTypes.TEXT,
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
    request_id: {
      type: DataTypes.INTEGER,
    },
  }, {
    timestamps: false,
    tableName: 'schedules',
    indexes: [
      {
        unique: true,
        fields: ['staff_id', 'start_date'],
      },
    ],
  });

  return Schedule;
};
