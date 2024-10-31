const dayjs = require("dayjs"); // Re-import the mocked dayjs

jest.mock("../../models", () => ({
  Staff: {
    findByPk: jest.fn(),
  },
  ArrangementRequest: {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  RequestGroup: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Schedule: {
    upsert: jest.fn(),
    destroy: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
    fn: jest.fn((fnName, col) => `${fnName}(${col})`), // Mock sequelize.fn
    col: jest.fn((colName) => colName), // Mock sequelize.col
    where: jest.fn(), // Mock sequelize.where
  },
}));

const { Op } = require("sequelize");
const {
  ArrangementRequest,
  RequestGroup,
  Schedule,
  Staff,
  sequelize,
} = require("../../models");
const arrangementService = require("../../services/arrangementService");
const notificationService = require("../../services/notificationService");
jest.mock("../../services/notificationService"); // Mock notification service

describe("arrangementService", () => {
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    // Mock sequelize transaction
    sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });
  describe("Get All Arrangements", () => {
    it("should return all arrangements successfully", async () => {
      // Mock data to be returned by findAll
      const mockArrangements = [
        {
          arrangement_id: 1,
          session_type: "WFH",
          start_date: "2024-10-29",
          request_status: "Approved",
        },
        {
          arrangement_id: 2,
          session_type: "WFH",
          start_date: "2024-11-01",
          request_status: "Pending",
        },
      ];

      // Mock dbArrangementRequest.findAll to return the mock data
      ArrangementRequest.findAll = jest
        .fn()
        .mockResolvedValue(mockArrangements);

      // Call the service function
      const result = await arrangementService.getAllArrangements();

      // Check if findAll was called
      expect(ArrangementRequest.findAll).toHaveBeenCalled();

      // Verify that the function returns the mocked arrangements
      expect(result).toEqual(mockArrangements);
    });

    it("should throw an error if fetching arrangements fails", async () => {
      // Mock findAll to throw an error
      ArrangementRequest.findAll = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the service function and expect it to throw an error
      await expect(arrangementService.getAllArrangements()).rejects.toThrow(
        "Could not fetch arrangement requests"
      );

      // Check if the error is logged
      expect(ArrangementRequest.findAll).toHaveBeenCalled();
    });
  });
  describe("get Arrangement By Manager", () => {
    it("should return pending arrangements for the given manager", async () => {
      // Mock data for requestGroups with pending requests
      const mockRequestGroups = [
        {
          request_group_id: 1,
          request_created_date: new Date("2024-10-28"),
          Staff: {
            staff_id: 100,
            staff_fname: "John",
            staff_lname: "Doe",
            dept: "IT",
            position: "Developer",
          },
          ArrangementRequests: [
            {
              arrangement_id: 101,
              session_type: "WFH",
              start_date: new Date("2024-10-29"),
              description: "Working from home",
              request_status: "Pending",
              updated_at: new Date(),
              approval_comment: null,
              approved_at: null,
            },
          ],
        },
      ];

      // Mock the database call
      RequestGroup.findAll = jest.fn().mockResolvedValue(mockRequestGroups);

      const manager_id = 1;

      const response = await arrangementService.getArrangementByManager(
        manager_id
      );

      // Ensure the requestGroups are queried with the correct manager_id
      expect(RequestGroup.findAll).toHaveBeenCalledWith({
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

      // Check that the response matches the expected format
      expect(response).toEqual({
        manager_id: manager_id,
        request_groups: [
          {
            request_group_id: 1,
            staff: {
              staff_id: 100,
              staff_fname: "John",
              staff_lname: "Doe",
              dept: "IT",
              position: "Developer",
            },
            request_created_date: new Date("2024-10-28"),
            arrangement_requests: [
              {
                arrangement_id: 101,
                session_type: "WFH",
                start_date: new Date("2024-10-29"),
                description: "Working from home",
                request_status: "Pending",
                updated_at: expect.any(Date),
                approval_comment: null,
                approved_at: null,
              },
            ],
          },
        ],
      });
    });

    it("should return an empty array when there are no pending arrangements for the manager", async () => {
      // Mock no pending requests
      RequestGroup.findAll = jest.fn().mockResolvedValue([]);

      const manager_id = 1;

      const response = await arrangementService.getArrangementByManager(
        manager_id
      );

      // Ensure the response format is correct even with no data
      expect(response).toEqual({
        manager_id: manager_id,
        request_groups: [],
      });

      // Ensure the database call was made with the correct manager_id
      expect(RequestGroup.findAll).toHaveBeenCalledWith({
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
    });

    it("should throw an error if fetching arrangements fails", async () => {
      // Mock findAll to throw an error
      RequestGroup.findAll = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const manager_id = 1;

      // Call the service function and expect it to throw an error
      await expect(
        arrangementService.getArrangementByManager(manager_id)
      ).rejects.toThrow("Database error");

      // Check if the error is logged
      expect(RequestGroup.findAll).toHaveBeenCalled();
    });
  });

  describe("createArrangement", () => {
    test("should create a new arrangement when no existing request is found", async () => {
      const arrangementData = {
        session_type: "WFH",
        start_date: "2024-10-05",
        description: "Working from home",
        staff_id: 1,
      };

      // Mocking findAll to return no existing requests
      ArrangementRequest.findAll.mockResolvedValue([]);

      // Mocking RequestGroup.create to create a new request group
      RequestGroup.create.mockResolvedValue({
        request_group_id: 1,
      });

      Staff.findByPk = jest.fn().mockResolvedValue({
        staff_id: 1,
        staff_fname: "John",
        staff_lname: "Doe",
        reporting_manager_id: 2,
      });

      // Mocking ArrangementRequest.create to create a new arrangement
      ArrangementRequest.create.mockResolvedValue({
        arrangement_id: 1,
        session_type: arrangementData.session_type,
        start_date: arrangementData.start_date,
        request_status: "Pending",
      });

      const transactionMock = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      sequelize.transaction.mockResolvedValue(transactionMock);

      const result = await arrangementService.createArrangement(
        arrangementData
      );

      expect(ArrangementRequest.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: RequestGroup,
            where: { staff_id: arrangementData.staff_id },
          },
        ],
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("DATE", sequelize.col("start_date")),
              "=",
              arrangementData.start_date
            ),
            { request_status: ["Pending", "Approved"] },
          ],
        },
      });

      expect(RequestGroup.create).toHaveBeenCalledWith(
        {
          staff_id: arrangementData.staff_id,
          request_created_date: expect.any(Date),
        },
        { transaction: expect.any(Object) }
      );

      expect(ArrangementRequest.create).toHaveBeenCalledWith(
        {
          session_type: arrangementData.session_type,
          start_date: arrangementData.start_date,
          description: arrangementData.description,
          request_status: "Pending",
          updated_at: expect.any(Date),
          approval_comment: null,
          approved_at: null,
          request_group_id: 1,
        },
        { transaction: expect.any(Object) }
      );

      expect(notificationService.createNotification).toHaveBeenCalledWith(
        2, // The manager's staff_id
        "John Doe submitted new ad-hoc WFH request", // Dynamic message
        "New WFH Request" // Notification type
      );

      expect(transactionMock.commit).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.arrangement_id).toBe(1);
    });

    test("should throw an error if an existing request is found", async () => {
      const arrangementData = {
        session_type: "WFH",
        start_date: "2024-10-05",
        staff_id: 1,
      };

      // Mocking findAll to return an existing request
      ArrangementRequest.findAll.mockResolvedValue([{}]);

      await expect(
        arrangementService.createArrangement(arrangementData)
      ).rejects.toThrow(
        "There is already a WFH request on this date for this staff member."
      );
    });
  });

  describe("createBatchArrangement", () => {
    test("should create a batch of new arrangements with the same request group", async () => {
      const batchData = {
        staff_id: 1,
        session_type: "WFH",
        description: "Weekly work-from-home",
        selected_days: ["Monday", "Wednesday"],
        num_occurrences: 2,
        repeat_type: "weekly",
        start_date: "2024-10-01",
      };

      // Mocking no existing requests
      ArrangementRequest.findAll.mockResolvedValue([]);

      // Mocking RequestGroup.create to return a single request group ID for all arrangements
      RequestGroup.create.mockResolvedValue({ request_group_id: 1 });

      // Mocking ArrangementRequest.create to simulate successful creation of arrangements
      ArrangementRequest.create.mockResolvedValue({ arrangement_id: 1 });

      const transactionMock = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      sequelize.transaction.mockResolvedValue(transactionMock);

      // Call the service function
      const result = await arrangementService.createBatchArrangement(batchData);

      // Verifying that findAll was called to check for existing requests
      expect(ArrangementRequest.findAll).toHaveBeenCalled();

      // Verifying that RequestGroup.create was called only once
      expect(RequestGroup.create).toHaveBeenCalledTimes(1);

      // Verifying that ArrangementRequest.create was called the correct number of times (2 days * 2 occurrences = 4)
      expect(ArrangementRequest.create).toHaveBeenCalledTimes(4);

      // Verifying that all ArrangementRequest.create calls used the same request_group_id
      expect(ArrangementRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ request_group_id: 1 }),
        { transaction: expect.any(Object) }
      );

      // Verifying that the transaction was committed
      expect(transactionMock.commit).toHaveBeenCalled();

      // Verifying that the result contains the correct success message
      expect(result.message).toBe("Batch WFH request created successfully.");
    });
    test("should rollback if creating batch request fails", async () => {
      const batchData = {
        staff_id: 1,
        session_type: "WFH",
        description: "Weekly work-from-home",
        selected_days: ["Monday", "Wednesday"],
        num_occurrences: 2,
        repeat_type: "weekly",
        start_date: "2024-10-01",
      };

      // Mocking no existing requests
      ArrangementRequest.findAll.mockResolvedValue([]);

      // Mocking ArrangementRequest.create to simulate successful creation of arrangements
      ArrangementRequest.create.mockResolvedValue({ arrangement_id: 1 });

      const transactionMock = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      sequelize.transaction.mockResolvedValue(transactionMock);
      RequestGroup.create.mockRejectedValue(new Error("Create failed"));

      sequelize.transaction.mockResolvedValue(transactionMock);

      await expect(
        arrangementService.createBatchArrangement(batchData)
      ).rejects.toThrow("Create failed");

      expect(transactionMock.rollback).toHaveBeenCalled();
    });
  });
  describe("approve Request", () => {
    it("should approve the request and create schedule entries", async () => {
      // Mock finding the request group
      const mockRequestGroup = { id: 1, staff_id: 100 };
      RequestGroup.findByPk = jest.fn().mockResolvedValue(mockRequestGroup);

      // Mock updating the ArrangementRequest to 'Approved'
      ArrangementRequest.update = jest.fn().mockResolvedValue([1]);

      // Mock finding all ArrangementRequests related to the request group
      const mockRequests = [
        {
          arrangement_id: 101,
          session_type: "WFH",
          start_date: "2024-10-29",
        },
      ];
      ArrangementRequest.findAll = jest.fn().mockResolvedValue(mockRequests);

      // Mock Schedule upsert
      Schedule.upsert = jest.fn().mockResolvedValue([1]);

      const id = 1;
      const comment = "Approved by manager";
      const manager_id = 2;

      const result = await arrangementService.approveRequest(
        id,
        comment,
        manager_id
      );

      // Ensure the request group is found
      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id);

      // Ensure the ArrangementRequest is updated to 'Approved'
      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Approved", approval_comment: comment },
        { where: { request_group_id: id } },
        { transaction: mockTransaction }
      );

      // Ensure the schedules are created
      expect(Schedule.upsert).toHaveBeenCalledWith(
        {
          staff_id: mockRequestGroup.staff_id,
          start_date: mockRequests[0].start_date,
          session_type: mockRequests[0].session_type,
          request_id: mockRequests[0].arrangement_id,
        },
        { transaction: mockTransaction }
      );

      // Ensure the transaction is committed
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ requestGroup: mockRequestGroup });
    });

    it("should throw an error if the request group is not found", async () => {
      // Mock request group not being found
      RequestGroup.findByPk = jest.fn().mockResolvedValue(null);

      const id = 1;
      const comment = "Approved by manager";
      const manager_id = 2;

      await expect(
        arrangementService.approveRequest(id, comment, manager_id)
      ).rejects.toThrow("Request group not found");

      // Ensure the transaction is rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should rollback the transaction and throw an error on failure", async () => {
      // Mock finding the request group
      const mockRequestGroup = { id: 1, staff_id: 100 };
      RequestGroup.findByPk = jest.fn().mockResolvedValue(mockRequestGroup);

      // Mock the update throwing an error
      ArrangementRequest.update = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      const id = 1;
      const comment = "Approved by manager";
      const manager_id = 2;

      await expect(
        arrangementService.approveRequest(id, comment, manager_id)
      ).rejects.toThrow("Update failed");

      // Ensure the transaction is rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("arrangementService.revokeRequest", () => {
    it("should revoke the request and delete schedule entries", async () => {
      // Mock finding the request group
      const mockRequestGroup = { id: 1, staff_id: 100 };
      RequestGroup.findByPk = jest.fn().mockResolvedValue(mockRequestGroup);

      // Mock updating the ArrangementRequest to 'Revoked'
      ArrangementRequest.update = jest.fn().mockResolvedValue([1]);

      // Mock finding all ArrangementRequests related to the request group
      const mockRequests = [
        {
          arrangement_id: 101,
          session_type: "WFH",
          start_date: "2024-10-29",
        },
      ];
      ArrangementRequest.findAll = jest.fn().mockResolvedValue(mockRequests);

      // Mock Schedule destroy
      Schedule.destroy = jest.fn().mockResolvedValue(1);

      const id = 1;
      const comment = "Revoked by manager";
      const manager_id = 2;

      const result = await arrangementService.revokeRequest(
        id,
        comment,
        manager_id
      );

      // Ensure the request group is found
      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id);

      // Ensure the ArrangementRequest is updated to 'Revoked'
      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Revoked", approval_comment: comment },
        { where: { request_group_id: id } },
        { transaction: mockTransaction }
      );

      // Ensure the schedules are deleted
      expect(Schedule.destroy).toHaveBeenCalledWith({
        where: {
          staff_id: mockRequestGroup.staff_id,
          start_date: mockRequests[0].start_date,
          session_type: mockRequests[0].session_type,
          request_id: mockRequests[0].arrangement_id,
        },
        transaction: mockTransaction,
      });

      // Ensure the transaction is committed
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ requestGroup: mockRequestGroup });
    });

    it("should throw an error if the request group is not found", async () => {
      // Mock request group not being found
      RequestGroup.findByPk = jest.fn().mockResolvedValue(null);

      const id = 1;
      const comment = "Revoked by manager";
      const manager_id = 2;

      await expect(
        arrangementService.revokeRequest(id, comment, manager_id)
      ).rejects.toThrow("Request group not found");

      // Ensure the transaction is rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should rollback the transaction and throw an error on failure", async () => {
      // Mock finding the request group
      const mockRequestGroup = { id: 1, staff_id: 100 };
      RequestGroup.findByPk = jest.fn().mockResolvedValue(mockRequestGroup);

      // Mock the update throwing an error
      ArrangementRequest.update = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      const id = 1;
      const comment = "Revoked by manager";
      const manager_id = 2;

      await expect(
        arrangementService.revokeRequest(id, comment, manager_id)
      ).rejects.toThrow("Update failed");

      // Ensure the transaction is rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("rejectRequest", () => {
    it('should reject the request and update the status to "Rejected"', async () => {
      // Mock finding the request group
      RequestGroup.findByPk = jest.fn().mockResolvedValue({ id: 1 });

      // Mock the update of ArrangementRequest
      ArrangementRequest.update = jest.fn().mockResolvedValue([1]);

      const id = 1;
      const comment = "Not approved";
      const manager_id = 2;

      const result = await arrangementService.rejectRequest(
        id,
        comment,
        manager_id
      );

      // Ensure the request group is found
      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id);

      // Ensure the request is updated to "Rejected"
      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Rejected", approval_comment: comment },
        { where: { request_group_id: id } },
        { transaction: mockTransaction }
      );

      // Ensure the transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ requestGroup: { id: 1 } });
    });

    it("should throw an error if the request group is not found", async () => {
      // Mock request group not being found
      RequestGroup.findByPk = jest.fn().mockResolvedValue(null);

      const id = 1;
      const comment = "Not approved";
      const manager_id = 2;

      await expect(
        arrangementService.rejectRequest(id, comment, manager_id)
      ).rejects.toThrow("Request group not found");

      // Ensure the transaction is rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should rollback the transaction and throw an error on failure", async () => {
      // Mock request group is found
      RequestGroup.findByPk = jest.fn().mockResolvedValue({ id: 1 });

      // Mock the update throwing an error
      ArrangementRequest.update = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      const id = 1;
      const comment = "Not approved";
      const manager_id = 2;

      await expect(
        arrangementService.rejectRequest(id, comment, manager_id)
      ).rejects.toThrow("Update failed");

      // Ensure the transaction is rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe("undo", () => {
    it('should revert the request status to "Pending"', async () => {
      // Mock finding the request group
      RequestGroup.findByPk = jest.fn().mockResolvedValue({ id: 1 });

      // Mock the update of ArrangementRequest
      ArrangementRequest.update = jest.fn().mockResolvedValue([1]);

      const id = 1;
      const comment = "Undoing rejection";
      const manager_id = 2;

      const result = await arrangementService.undo(id, comment, manager_id);

      // Ensure the request group is found
      expect(RequestGroup.findByPk).toHaveBeenCalledWith(id);

      // Ensure the request is updated to "Pending"
      expect(ArrangementRequest.update).toHaveBeenCalledWith(
        { request_status: "Pending", approval_comment: comment },
        { where: { request_group_id: id } },
        { transaction: mockTransaction }
      );

      // Ensure the transaction was committed
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual({ requestGroup: { id: 1 } });
    });

    it("should throw an error if the request group is not found", async () => {
      // Mock request group not being found
      RequestGroup.findByPk = jest.fn().mockResolvedValue(null);

      const id = 1;
      const comment = "Undoing rejection";
      const manager_id = 2;

      await expect(
        arrangementService.undo(id, comment, manager_id)
      ).rejects.toThrow("Request group not found");

      // Ensure the transaction is rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it("should rollback the transaction and throw an error on failure", async () => {
      // Mock request group is found
      RequestGroup.findByPk = jest.fn().mockResolvedValue({ id: 1 });

      // Mock the update throwing an error
      ArrangementRequest.update = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      const id = 1;
      const comment = "Undoing rejection";
      const manager_id = 2;

      await expect(
        arrangementService.undo(id, comment, manager_id)
      ).rejects.toThrow("Update failed");

      // Ensure the transaction is rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
  it("should return approved requests for the given manager", async () => {
    // Mock data for requestGroups with approved requests
    const mockRequestGroups = [
      {
        request_group_id: 1,
        request_created_date: new Date("2024-10-28"),
        Staff: {
          staff_id: 100,
          staff_fname: "John",
          staff_lname: "Doe",
          dept: "IT",
          position: "Developer",
        },
        ArrangementRequests: [
          {
            arrangement_id: 101,
            session_type: "WFH",
            start_date: new Date("2024-10-29"),
            description: "Working from home",
            request_status: "Approved",
            updated_at: new Date(),
            approval_comment: "Approved by manager",
            approved_at: new Date(),
          },
        ],
      },
    ];

    // Mock the database call
    RequestGroup.findAll = jest.fn().mockResolvedValue(mockRequestGroups);

    const manager_id = 1;

    const response = await arrangementService.getApprovedRequests(manager_id);

    // Ensure the requestGroups are queried with the correct manager_id
    expect(RequestGroup.findAll).toHaveBeenCalledWith({
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

    // Check that the response matches the expected format
    expect(response).toEqual({
      manager_id: manager_id,
      request_groups: [
        {
          request_group_id: 1,
          staff: {
            staff_id: 100,
            staff_fname: "John",
            staff_lname: "Doe",
            dept: "IT",
            position: "Developer",
          },
          request_created_date: new Date("2024-10-28"),
          arrangement_requests: [
            {
              arrangement_id: 101,
              session_type: "WFH",
              start_date: new Date("2024-10-29"),
              description: "Working from home",
              request_status: "Approved",
              updated_at: expect.any(Date), // Match any Date object
              approval_comment: "Approved by manager",
              approved_at: expect.any(Date), // Match any Date object
            },
          ],
        },
      ],
    });
  });
});
