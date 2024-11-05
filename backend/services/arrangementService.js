const db = require("../models"); // Centralized import for all models
const sequelize = db.sequelize; // Import sequelize instance for transactions
const { Op } = require("sequelize"); // Import Sequelize operators
const dayjs = require("dayjs");
const notificationService = require("./notificationService");

const pendingNotifications = {}; // In-memory store for notifications
const DELAY = 5000; // Delay of 5 seconds

async function scheduleNotification(
  request_group_id,
  staff_id,
  message,
  title
) {
  // If there is already a timer, clear it (reset the delay)
  if (pendingNotifications[request_group_id]) {
    clearTimeout(pendingNotifications[request_group_id].timer);
  }

  // Create a new timeout to send the notification after the delay
  const timer = setTimeout(async () => {
    try {
      // Send the notification asynchronously
      await notificationService.createNotification(staff_id, message, title);
      console.log("Notification sent for request group:", request_group_id);
    } catch (error) {
      console.error("Error sending notification:", error);
    }

    // Remove the entry from pendingNotifications after sending
    delete pendingNotifications[request_group_id];
  }, DELAY);

  // Store the staff_id, message, title, and timer in the object
  pendingNotifications[request_group_id] = { staff_id, message, title, timer };
}

// Create arrangement service with check for existing WFH requests (date-only comparison)
exports.createArrangement = async (arrangementData) => {
  const transaction = await sequelize.transaction(); // Begin a transaction for atomic operations
  try {
    // Check for existing ArrangementRequest for the same staff and same date (ignoring time)
    const existingRequests = await db.ArrangementRequest.findAll({
      include: [
        {
          model: db.RequestGroup,
          where: { staff_id: arrangementData.staff_id },
        },
      ],
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("start_date")),
            "=",
            arrangementData.start_date
          ), // Compare only the date part
          { request_status: ["Pending", "Approved"] }, // Check for Pending and Approved requests
        ],
      },
    });
    // If there's an existing request for the same date with Pending/Approved status, throw an error
    if (existingRequests.length > 0) {
      throw new Error(
        "There is already a WFH request on this date for this staff member."
      );
    }

    // Create a new Request Group for the staff member
    const newRequestGroup = await db.RequestGroup.create(
      {
        staff_id: arrangementData.staff_id,
        request_created_date: new Date(),
      },
      { transaction }
    );

    // Create a new Arrangement Request
    const newArrangement = await db.ArrangementRequest.create(
      {
        session_type: arrangementData.session_type,
        start_date: arrangementData.start_date,
        description: arrangementData.description || null, // Description is optional
        request_status: "Pending",
        updated_at: new Date(),
        approval_comment: null,
        approved_at: null,
        request_group_id: newRequestGroup.request_group_id,
      },
      { transaction }
    );

    // Send Notification
    const staff_query = await db.Staff.findByPk(arrangementData.staff_id);
    const staff_fname = staff_query.staff_fname;
    const staff_lname = staff_query.staff_lname;
    const staff_full_name = `${staff_fname} ${staff_lname}`;
    const manager_id = staff_query.reporting_manager_id;
    const message = `${staff_full_name} submitted new ad-hoc WFH request`;
    await notificationService.createNotification(
      manager_id, // Send notification to the manager
      message, // Dynamic message with staff name
      "New WFH Request" // Notification type
    );
    await transaction.commit();
    return newArrangement;
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating arrangement request:", error);
    throw new Error(error.message || "Could not create arrangement request");
  }
};

exports.createBatchArrangement = async (batchData) => {
  const transaction = await sequelize.transaction(); // Begin a transaction for atomic operations
  try {
    const newRequests = [];
    const cancelledRequests = [];
    const {
      staff_id,
      session_type,
      description,
      num_occurrences,
      repeat_type,
      start_date,
    } = batchData;

    const startDay = dayjs(start_date);

    // Create the request group once for all occurrences in this batch
    const newRequestGroup = await db.RequestGroup.create(
      {
        staff_id: staff_id,
        request_created_date: new Date(),
      },
      { transaction }
    );

    for (let i = 0; i < num_occurrences; i++) {
      let dateToApply;

      if (i === 0) {
        // Use the provided start date for the first occurrence
        dateToApply = startDay;
      } else {
        if (repeat_type === "weekly") {
          dateToApply = startDay.add(i * 7, "day");
        } else if (repeat_type === "bi-weekly") {
          dateToApply = startDay.add(i * 14, "day");
        }
      }

      const formattedDate = dateToApply.format("YYYY-MM-DD");

      // Check if there is an existing request for this date
      const existingRequests = await db.ArrangementRequest.findAll({
        include: [
          {
            model: db.RequestGroup,
            where: { staff_id: staff_id },
          },
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("DATE", sequelize.col("start_date")),
              "=",
              formattedDate
            ),
            { request_status: ["Pending", "Approved"] },
          ],
        },
      });

      // Cancel existing requests if they exist
      if (existingRequests.length > 0) {
        for (const existingRequest of existingRequests) {
          await db.ArrangementRequest.update(
            { request_status: "Cancelled" },
            {
              where: { arrangement_id: existingRequest.arrangement_id },
              transaction,
            }
          );
          cancelledRequests.push(existingRequest); // Track cancelled requests
        }
      }

      // Create a new Arrangement Request for each occurrence, using the same request group
      const newArrangement = await db.ArrangementRequest.create(
        {
          session_type: session_type,
          start_date: formattedDate,
          description: description || null,
          request_status: "Pending",
          updated_at: new Date(),
          approval_comment: null,
          approved_at: null,
          request_group_id: newRequestGroup.request_group_id, // Use the same request group for all
        },
        { transaction }
      );

      newRequests.push(newArrangement); // Track new requests
    }

    // Send Notification
    const staff_query = await db.Staff.findByPk(staff_id);
    const staff_fname = staff_query.staff_fname;
    const staff_lname = staff_query.staff_lname;
    const staff_full_name = `${staff_fname} ${staff_lname}`;
    const manager_id = staff_query.reporting_manager_id;
    const message = `${staff_full_name} submitted new repeating WFH request`;
    await notificationService.createNotification(
      manager_id, // Send notification to the manager
      message, // Dynamic message with staff name
      "New WFH Request" // Notification type
    );
    await transaction.commit();

    return {
      message: "Batch WFH request created successfully.",
      new_requests: newRequests,
      cancelled_requests: cancelledRequests,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating batch arrangement request:", error);
    throw new Error(
      error.message || "Could not create batch arrangement request"
    );
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
exports.approvePartialRequest = async (id, comment, data, manager_id) => {
  const transaction = await sequelize.transaction();
  try {
    // Find the request group
    const requestGroup = await db.RequestGroup.findByPk(id);
    if (!requestGroup) throw new Error("Request group not found");

    // Validation check to see if manager allowed to approve

    // Update request status based on provided data (key-value pairs)
    for (const [arrangementId, status] of Object.entries(data)) {
      if (status === "Approved" || status === "Rejected") {
        await db.ArrangementRequest.update(
          { request_status: status, approval_comment: comment },
          { where: { arrangement_id: arrangementId, request_group_id: id } },
          { transaction }
        );
      }
    }

    // Create schedule entries for approved requests only
    const approvedRequests = await db.ArrangementRequest.findAll({
      where: { request_group_id: id, request_status: "Approved" },
    });

    for (const request of approvedRequests) {
      await db.Schedule.upsert(
        {
          staff_id: requestGroup.staff_id,
          start_date: request.start_date,
          session_type: request.session_type,
          request_id: request.arrangement_id,
        },
        { transaction }
      );
    }

    // Send Notification
    const staff_query = await db.Staff.findByPk(manager_id);
    const staff_fname = staff_query.staff_fname;
    const staff_lname = staff_query.staff_lname;
    const staff_full_name = `${staff_fname} ${staff_lname}`;
    const message = `${staff_full_name} has partially approved/rejected your WFH request`;
    const title = "WFH Request Status Updated";
    scheduleNotification(id, requestGroup.staff_id, message, title);

    await transaction.commit();
    return { requestGroup };
  } catch (error) {
    await transaction.rollback();
    throw error; // Rethrow the error for the controller to handle
  }
};

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
          staff_id: requestGroup.staff_id,
          start_date: request.start_date,
          session_type: request.session_type,
          request_id: request.arrangement_id,
        },
        { transaction }
      );
    }

    // Send Notification
    const staff_query = await db.Staff.findByPk(manager_id);
    const staff_fname = staff_query.staff_fname;
    const staff_lname = staff_query.staff_lname;
    const staff_full_name = `${staff_fname} ${staff_lname}`;
    const message = `${staff_full_name} has approved your WFH request`;
    const title = "WFH Approved";
    scheduleNotification(id, requestGroup.staff_id, message, title);

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
    // Send Notification
    const staff_query = await db.Staff.findByPk(manager_id);
    const staff_fname = staff_query.staff_fname;
    const staff_lname = staff_query.staff_lname;
    const staff_full_name = `${staff_fname} ${staff_lname}`;
    const message = `${staff_full_name} has rejected your WFH request`;
    const title = "WFH Rejected";
    scheduleNotification(id, requestGroup.staff_id, message, title);

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
        transaction, // Include transaction for rollback if something fails
      });
    }

    // Send Notification
    const staff_query = await db.Staff.findByPk(manager_id);
    const staff_fname = staff_query.staff_fname;
    const staff_lname = staff_query.staff_lname;
    const staff_full_name = `${staff_fname} ${staff_lname}`;
    const message = `${staff_full_name} has revoked your WFH request`;
    const title = "WFH Revoked";
    await notificationService.createNotification(
      requestGroup.staff_id,
      message,
      title
    );

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

// Get arrangements by staff service
// services/arrangementService.js

exports.getArrangementbyStaff = async (staff_id) => {
  const requestGroups = await db.RequestGroup.findAll({
    where: { staff_id },
    include: [
      {
        model: db.Staff,
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
        // No `where` condition here to fetch all statuses
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

  const response = {
    staff_id: staff_id,
    request_groups: requestGroups.map((group) => ({
      request_group_id: group.request_group_id,
      staff: group.Staff,
      request_created_date: group.request_created_date,
      arrangement_requests: group.ArrangementRequests,
    })),
  };

  return response;
};

exports.withdrawRequest = async (id, comment, staff_id) => {
  const transaction = await sequelize.transaction();
  try {
    const requestGroup = await db.RequestGroup.findByPk(id);
    if (!requestGroup) throw new Error("Request group not found");

    await db.ArrangementRequest.update(
      { request_status: "Withdrawn", approval_comment: comment },
      { where: { request_group_id: id }, transaction }
    );

    const requests = await db.ArrangementRequest.findAll({
      where: { request_group_id: id },
      transaction,
    });

    for (const request of requests) {
      await db.Schedule.destroy({
        where: {
          staff_id: requestGroup.staff_id,
          start_date: request.start_date,
        },
        transaction,
      });
    }

    await transaction.commit();
    return { requestGroup, requests };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
