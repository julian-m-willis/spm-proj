const { Schedule } = require('../models');

exports.createSchedule = async (data) => {
  return await Schedule.create(data);
};

// Implement other methods similarly