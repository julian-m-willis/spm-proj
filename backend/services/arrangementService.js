const { ArrangementRequest, RequestGroup, Staff } = require("../models");
const staff = require("../models/staff");
const sequelize = require("../models").sequelize; // Import sequelize instance for transactions

exports.createArrangement = async (arrangementData) => {
  const transaction = await sequelize.transaction(); // Begin a transaction for atomic operations
  try {
    const newRequestGroup = await RequestGroup.create(
      {
        staff_id: arrangementData.staff_id,
        request_created_date: new Date(),
      },
      { transaction }
    );

    const newArrangement = await ArrangementRequest.create(
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

    await transaction.commit();

    return newArrangement;
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating arrangement request:", error);
    throw new Error("Could not create arrangement request");
  }
};

exports.getAllArrangements = async () => {
  try {
    const arrangements = await ArrangementRequest.findAll(); // Fetches all records
    return arrangements;
  } catch (error) {
    console.error("Error fetching all arrangement requests:", error);
    throw new Error("Could not fetch arrangement requests");
  }
};

exports.getArrangementByManager = async (manager_id) => {
  const requestGroups = await RequestGroup.findAll({
    include: [
      {
        model: Staff,
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
        model: ArrangementRequest,
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
