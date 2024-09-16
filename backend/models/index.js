const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.js');
const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env]);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Initialize models
db.Staff = require('./staff')(sequelize, DataTypes);
db.RequestGroup = require('./requestGroup')(sequelize, DataTypes);
db.ArrangementRequest = require('./arrangementRequest')(sequelize, DataTypes);
db.Schedule = require('./schedule')(sequelize, DataTypes);

// Create associations (defining relationships)

// Staff has many RequestGroups
db.Staff.hasMany(db.RequestGroup, { foreignKey: 'staff_id' });
db.RequestGroup.belongsTo(db.Staff, { foreignKey: 'staff_id' });

// ArrangementRequest belongs to RequestGroup
db.ArrangementRequest.belongsTo(db.RequestGroup, { foreignKey: 'request_group_id' });
db.RequestGroup.hasMany(db.ArrangementRequest, { foreignKey: 'request_group_id' });

// Schedule belongs to ArrangementRequest
db.Schedule.belongsTo(db.ArrangementRequest, { foreignKey: 'request_id' });
db.ArrangementRequest.hasMany(db.Schedule, { foreignKey: 'request_id' });

// Sync models (sync all tables)
db.sequelize.sync({ force: false })
  .then(() => {
    console.log("Models synced successfully.");
  })
  .catch(err => {
    console.error("Error syncing models:", err);
  });

module.exports = db;