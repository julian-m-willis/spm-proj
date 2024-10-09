const arrangementService = require('../services/arrangementService');

exports.createArrangement = async (req, res) => {
  try {
    const data = {
      ...req.body,
      staff_id: req.user.staff_id,
    };

    const arrangement = await arrangementService.createArrangement(data);
    res.status(201).json(arrangement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllArrangements = async (req, res) => {
  try {
    const arrangements = await arrangementService.getAllArrangements();
    return res.status(200).json(arrangements);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
// Implement other methods similarly
