const arrangementService = require('../services/arrangementService');

exports.createArrangement = async (req, res) => {
  try {
    const arrangement = await arrangementService.createArrangement(req.body);
    res.status(201).json(arrangement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Implement other methods similarly
