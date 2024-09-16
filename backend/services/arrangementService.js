const { ArrangementRequest } = require('../models');

exports.createArrangement = async (data) => {
  return await ArrangementRequest.create(data);
};

// Implement other methods similarly
