// Mock the `RequestGroup` and `ArrangementRequest` models
jest.mock('../../models', () => ({
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
  },
}));

const { ArrangementRequest, RequestGroup, Schedule, sequelize } = require('../../models');
const arrangementService = require('../../services/arrangementService');

describe('arrangementService', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  test('should create a new arrangement with a request group', async () => {
    const arrangementData = {
      session_type: 'Workshop',
      start_date: new Date(),
      description: 'Team-building workshop',
      staff_id: 2
    };

    // Mock RequestGroup.create to resolve with a request group
    RequestGroup.create.mockResolvedValue({
      request_group_id: 1,
      staff_id: 2,
      request_created_date: new Date(),
    });

    // Mock ArrangementRequest.create to resolve with a new arrangement
    ArrangementRequest.create.mockResolvedValue({
      arrangement_id: 1,
      session_type: 'Workshop',
      start_date: new Date(),
      description: 'Team-building workshop',
      request_status: 'Pending',
      request_group_id: 1,
    });

    const transactionMock = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction.mockResolvedValue(transactionMock); // Mock transaction

    // Call the service method
    const result = await arrangementService.createArrangement(arrangementData);

    // Assertions
    expect(RequestGroup.create).toHaveBeenCalledWith({
      staff_id: arrangementData.staff_id,
      request_created_date: expect.any(Date),
    }, { transaction: expect.any(Object) });

    expect(ArrangementRequest.create).toHaveBeenCalledWith({
      session_type: arrangementData.session_type,
      start_date: arrangementData.start_date,
      description: arrangementData.description,
      request_status: 'Pending',
      updated_at: expect.any(Date),
      approval_comment: null,
      approved_at: null,
      request_group_id: 1,
    }, { transaction: expect.any(Object) });

    expect(transactionMock.commit).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.session_type).toBe('Workshop');
  });

  test('should approve a request and create schedule entries', async () => {
    const mockRequestGroup = { request_group_id: 1, staff_id: 1001 };
    const mockRequests = [
      { arrangement_id: 1, session_type: 'WFH', start_date: '2024-10-01' },
    ];

    // Mock DB responses
    RequestGroup.findByPk.mockResolvedValue(mockRequestGroup);
    ArrangementRequest.findAll.mockResolvedValue(mockRequests);
    Schedule.upsert.mockResolvedValue();

    const transactionMock = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction.mockResolvedValue(transactionMock);

    // Call service to approve request
    const result = await arrangementService.approveRequest(1, 'Approved comment', 1001);

    expect(RequestGroup.findByPk).toHaveBeenCalledWith(1);

    expect(Schedule.upsert).toHaveBeenCalledWith(
      {
        staff_id: mockRequestGroup.staff_id,
        start_date: mockRequests[0].start_date,
        session_type: mockRequests[0].session_type,
        request_id: mockRequests[0].arrangement_id,
      },
      { transaction: expect.any(Object) }
    );

    expect(transactionMock.commit).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.requestGroup).toEqual(mockRequestGroup);
  });

  test('should revoke a request and delete the schedule', async () => {
    const mockRequestGroup = { request_group_id: 1, staff_id: 1001 };
    const mockRequests = [
      { arrangement_id: 1, session_type: 'WFH', start_date: '2024-10-01' },
    ];

    // Mock DB responses
    RequestGroup.findByPk.mockResolvedValue(mockRequestGroup);
    ArrangementRequest.findAll.mockResolvedValue(mockRequests);
    Schedule.destroy.mockResolvedValue();

    const transactionMock = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction.mockResolvedValue(transactionMock);

    // Call service to revoke request
    const result = await arrangementService.revokeRequest(1, 'Revoke comment', 1001);

    expect(RequestGroup.findByPk).toHaveBeenCalledWith(1);

    expect(Schedule.destroy).toHaveBeenCalledWith({
      where: {
        staff_id: mockRequestGroup.staff_id,
        start_date: mockRequests[0].start_date,
        session_type: mockRequests[0].session_type,
        request_id: mockRequests[0].arrangement_id,
      },
      transaction: expect.any(Object),
    });

    expect(transactionMock.commit).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.requestGroup).toEqual(mockRequestGroup);
  });

  test('should rollback if revoking request fails', async () => {
    RequestGroup.findByPk.mockRejectedValue(new Error('Revoke failed'));

    const transactionMock = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction.mockResolvedValue(transactionMock);

    await expect(arrangementService.revokeRequest(1, 'Revoke comment', 1001)).rejects.toThrow('Revoke failed');

    expect(transactionMock.rollback).toHaveBeenCalled();
  });
});
