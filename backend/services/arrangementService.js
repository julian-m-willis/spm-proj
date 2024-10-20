const db = require("../models"); // Centralized import for all models
const sequelize = db.sequelize; // Import sequelize instance for transactions
const { Op } = require('sequelize'); // Import Sequelize operators

// Create arrangement service
// exports.createArrangement = async (arrangementData) => {
//   const transaction = await sequelize.transaction(); // Begin a transaction for atomic operations
//   try {
//     const newRequestGroup = await db.RequestGroup.create(
//       {
//         staff_id: arrangementData.staff_id,
//         request_created_date: new Date(),
//       },
//       { transaction }
//     );

//     const newArrangement = await db.ArrangementRequest.create(
//       {
//         session_type: arrangementData.session_type,
//         start_date: arrangementData.start_date,
//         description: arrangementData.description,
//         request_status: "Pending",
//         updated_at: new Date(),
//         approval_comment: null,
//         approved_at: null,
//         request_group_id: newRequestGroup.request_group_id,
//       },
//       { transaction }
//     );

//     await transaction.commit();
//     return newArrangement;
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error creating arrangement request:", error);
//     throw new Error("Could not create arrangement request");
//   }
// };

exports.createArrangement = async (arrangementData) => {
  const transaction = await sequelize.transaction(); // Begin a transaction for atomic operations
  try {
    const existingArrangement = await db.ArrangementRequest.findOne({
      where: {
        start_date: arrangementData.start_date,
        request_status: {
          [Op.in]: ['Pending', 'Approved'],
        },
      },
      include: [{
        model: db.RequestGroup,
        as: 'RequestGroup',  // Ensure alias matches association
        where: {
          staff_id: arrangementData.staff_id,  // Check staff_id in RequestGroup
        },
      }],
    });
    
    if (existingArrangement) {
      // If an arrangement exists, throw an error or return a message
      console.log('Arrangement already exists:', existingArrangement);  // Log for debugging
      throw new Error("An arrangement already exists for this date");
    } else {
      const newRequestGroup = await db.RequestGroup.create(
        {
          staff_id: arrangementData.staff_id,
          request_created_date: new Date(),
        },
        { transaction }
      );
  
      const newArrangement = await db.ArrangementRequest.create(
        {
          session_type: arrangementData.session_type,
          start_date: arrangementData.start_date,
          description: arrangementData.description,
          request_status: "Pending",
          updated_at: new Date(),
          approval_comment: null,
          approved_at: null,
          request_group_id: newRequestGroup.request_group_id,
        },
        { transaction }
      );
  
      // Commit the transaction if everything is successful
      await transaction.commit();
      return newArrangement;
    }
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    console.error("Error creating arrangement request:", error);
    throw new Error(error.message || "Could not create arrangement request");
  }
};

// Get all arrangements service
exports.getAllArrangements = async () => {
  try {
    const arrangements = await db.ArrangementRequest.findAll(); // Fetches all records
    return arrangements;
  } catch (error) {
    console.error("Error fetching all arrangement requests:", error);
    throw new Error("Could not fetch arrangement requests");
  }
};

// Get arrangements by manager service
exports.getArrangementByManager = async (manager_id) => {
  const requestGroups = await db.RequestGroup.findAll({
    include: [
      {
        model: db.Staff, // Use db object for models
        where: { reporting_manager_id: manager_id },
        attributes: [
          "staff_id",
          "staff_fname",
          "staff_lname",
          "dept",
          "position",
        ],
      },
      {
        model: db.ArrangementRequest,
        where: { request_status: "Pending" },
        attributes: [
          "arrangement_id",
          "session_type",
          "start_date",
          "description",
          "request_status",
          "updated_at",
          "approval_comment",
          "approved_at",
        ],
      },
    ],
  });
  // Format the response
  const response = {
    manager_id: manager_id,
    request_groups: requestGroups.map((group) => ({
      request_group_id: group.request_group_id,
      staff: group.Staff,
      request_created_date: group.request_created_date,
      arrangement_requests: group.ArrangementRequests, // Assuming the association is set up
    })),
  };
  return response;
};

// Approve request service
exports.approveRequest = async (id, comment, manager_id) => {
  const transaction = await sequelize.transaction();
  try {
    // Find the request group
    const requestGroup = await db.RequestGroup.findByPk(id);
    if (!requestGroup) throw new Error("Request group not found");

    //Validation check to see if manager allowed to approve

    // Update request group status to approved
    await db.ArrangementRequest.update(
      { request_status: "Approved", approval_comment: comment },
      { where: { request_group_id: id } },
      { transaction }
    );

    // Create schedule entries
    const requests = await db.ArrangementRequest.findAll({
      where: { request_group_id: id },
    });

    for (const request of requests) {
      await db.Schedule.upsert(
        {
          staff_id: requestGroup.staff_id, // Adjust as needed
          start_date: request.start_date,
          session_type: request.session_type,
          request_id: request.arrangement_id,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return { requestGroup };
  } catch (error) {
    await transaction.rollback();
    throw error; // Rethrow the error for the controller to handle
  }
};

exports.rejectRequest = async (id, comment, manager_id) => {
  const transaction = await sequelize.transaction();
  try {
    // Find the request group
    const requestGroup = await db.RequestGroup.findByPk(id);
    if (!requestGroup) throw new Error("Request group not found");

    //Validation check to see if manager allowed to approve

    // Update request group status to approved
    await db.ArrangementRequest.update(
      { request_status: "Rejected", approval_comment: comment },
      { where: { request_group_id: id } },
      { transaction }
    );
    await transaction.commit();
    return { requestGroup };
  } catch (error) {
    await transaction.rollback();
    throw error; // Rethrow the error for the controller to handle
  }
};

exports.undo = async (id, comment, manager_id) => {
  const transaction = await sequelize.transaction();
  try {
    // Find the request group
    const requestGroup = await db.RequestGroup.findByPk(id);
    if (!requestGroup) throw new Error("Request group not found");

    //Validation check to see if manager allowed to approve

    // Update request group status to approved
    await db.ArrangementRequest.update(
      { request_status: "Pending", approval_comment: comment },
      { where: { request_group_id: id } },
      { transaction }
    );
    await transaction.commit();
    return { requestGroup };
  } catch (error) {
    await transaction.rollback();
    throw error; // Rethrow the error for the controller to handle
  }
};

// Revoke request service
exports.revokeRequest = async (id, comment, manager_id) => {
  const transaction = await sequelize.transaction();
  try {
    // Find the request group
    const requestGroup = await db.RequestGroup.findByPk(id);
    if (!requestGroup) throw new Error("Request group not found");

    //Validation check to see if manager allowed to approve

    // Update request group status to approved
    await db.ArrangementRequest.update(
      { request_status: "Revoked", approval_comment: comment },
      { where: { request_group_id: id } },
      { transaction }
    );

    // Create schedule entries
    const requests = await db.ArrangementRequest.findAll({
      where: { request_group_id: id },
    });

    for (const request of requests) {
      await db.Schedule.destroy({
        where: {
          staff_id: requestGroup.staff_id,
          start_date: request.start_date,
          session_type: request.session_type,
          request_id: request.arrangement_id,
        },
        transaction  // Include transaction for rollback if something fails
      });
    }

    await transaction.commit();
    return { requestGroup };
  } catch (error) {
    await transaction.rollback();
    throw error; // Rethrow the error for the controller to handle
  }
};

// Get arrangements by manager service
exports.getApprovedRequests = async (manager_id) => {
  const requestGroups = await db.RequestGroup.findAll({
    include: [
      {
        model: db.Staff, // Use db object for models
        where: { reporting_manager_id: manager_id },
        attributes: [
          "staff_id",
          "staff_fname",
          "staff_lname",
          "dept",
          "position",
        ],
      },
      {
        model: db.ArrangementRequest,
        where: { request_status: "Approved" },
        attributes: [
          "arrangement_id",
          "session_type",
          "start_date",
          "description",
          "request_status",
          "updated_at",
          "approval_comment",
          "approved_at",
        ],
      },
    ],
  });
  // Format the response
  const response = {
    manager_id: manager_id,
    request_groups: requestGroups.map((group) => ({
      request_group_id: group.request_group_id,
      staff: group.Staff,
      request_created_date: group.request_created_date,
      arrangement_requests: group.ArrangementRequests, // Assuming the association is set up
    })),
  };
  return response;
};