const scheduleService = require('../services/scheduleService');

exports.createSchedule = async (req, res) => {
  try {
    const schedule = await scheduleService.createSchedule(req.body);
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Implement other methods similarly
