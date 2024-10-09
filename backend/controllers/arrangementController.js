const arrangementService = require("../services/arrangementService");

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
exports.getArrangementbyManager = async (req, res) => {
  try {
    const manager_id = req.user.staff_id;
    const arrangements = await arrangementService.getArrangementByManager(
      manager_id
    );
    res.status(200).json(arrangements);
  } catch (error) {
    console.error("Error fetching arrangement requests by manager:", error);
    res.status(500).json({ error: "Could not fetch arrangement requests" });
  }
};

// Approve ALL request controller
exports.approveRequest = async (req, res) => {
  const manager_id = req.user.staff_id;
  const { id } = req.params;
  const { comment } = req.body;
  try {
    const result = await arrangementService.approveRequest(id, comment, manager_id);
    return res.status(200).json({ message: "Request approved", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  const manager_id = req.user.staff_id;
  const { id } = req.params;
  const { comment } = req.body;
  try {
    const result = await arrangementService.rejectRequest(id, comment, manager_id);
    return res.status(200).json({ message: "Request approved", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

exports.undo = async (req, res) => {
  const manager_id = req.user.staff_id;
  const { id } = req.params;
  const { comment } = req.body;
  try {
    const result = await arrangementService.undo(id, comment, manager_id);
    return res.status(200).json({ message: "Request approved", data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
