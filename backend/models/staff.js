module.exports = (sequelize, DataTypes) => {
  const Staff = sequelize.define('Staff', {
    staff_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      index: true,
    },
    staff_fname: DataTypes.STRING,
    staff_lname: DataTypes.STRING,
    dept: DataTypes.STRING,
    position: DataTypes.STRING,
    country: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      index: true,
    },
    reporting_manager_id: DataTypes.INTEGER,
    hashed_password: DataTypes.STRING,
    role_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    is_active: DataTypes.BOOLEAN,
  }, {
    timestamps: false,
    tableName: 'staffs',
  });

  return Staff;
};
