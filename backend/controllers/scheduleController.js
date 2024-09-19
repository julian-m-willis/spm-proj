const scheduleService = require('../services/scheduleService');

exports.createSchedule = async (req, res) => {
  try {
    const data = {
      ...req.body,
      staff_id: req.user.staff_id,
    };

    const schedule = await scheduleService.createSchedule(data);
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getScheduleByDepartment = async (req, res) => {
  try {
    const { departmentname } = req.params;
    const { position, start_date, end_date } = req.query;

    const schedules = await scheduleService.getScheduleByDepartment({
      departmentname,
      position,
      start_date,
      end_date,
    });

    res.status(200).json(schedules);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Implement other methods similarly
