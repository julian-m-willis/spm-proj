module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define("Notification", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
            staff_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        index: true,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING, // E.g., 'WFH Request', 'Approval', etc.
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("unread", "read"),
        defaultValue: "unread",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });
    return Notification;
};