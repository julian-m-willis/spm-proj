const dayjs = require('dayjs'); // Re-import the mocked dayjs

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
    fn: jest.fn((fnName, col) => `${fnName}(${col})`), // Mock sequelize.fn
    col: jest.fn((colName) => colName), // Mock sequelize.col
    where: jest.fn(), // Mock sequelize.where
  }
}));
const { Op } = require('sequelize');
const { ArrangementRequest, RequestGroup, Schedule, sequelize } = require('../../models');
const arrangementService = require('../../services/arrangementService');

describe('arrangementService', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  describe('createArrangement', () => {
    test('should create a new arrangement when no existing request is found', async () => {
      const arrangementData = {
        session_type: 'WFH',
        start_date: '2024-10-05',
        description: 'Working from home',
        staff_id: 1,
      };

      // Mocking findAll to return no existing requests
      ArrangementRequest.findAll.mockResolvedValue([]);

      // Mocking RequestGroup.create to create a new request group
      RequestGroup.create.mockResolvedValue({
        request_group_id: 1,
      });

      // Mocking ArrangementRequest.create to create a new arrangement
      ArrangementRequest.create.mockResolvedValue({
        arrangement_id: 1,
        session_type: arrangementData.session_type,
        start_date: arrangementData.start_date,
        request_status: 'Pending',
      });

      const transactionMock = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      sequelize.transaction.mockResolvedValue(transactionMock);

      const result = await arrangementService.createArrangement(arrangementData);

      expect(ArrangementRequest.findAll).toHaveBeenCalledWith({
        include: [
          {
            model: RequestGroup,
            where: { staff_id: arrangementData.staff_id },
          },
        ],
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn('DATE', sequelize.col('start_date')), '=', arrangementData.start_date),
            { request_status: ['Pending', 'Approved'] },
          ],
        },
      });

      expect(RequestGroup.create).toHaveBeenCalledWith(
        { staff_id: arrangementData.staff_id, request_created_date: expect.any(Date) },
        { transaction: expect.any(Object) }
      );

      expect(ArrangementRequest.create).toHaveBeenCalledWith(
        {
          session_type: arrangementData.session_type,
          start_date: arrangementData.start_date,
          description: arrangementData.description,
          request_status: 'Pending',
          updated_at: expect.any(Date),
          approval_comment: null,
          approved_at: null,
          request_group_id: 1,
        },
        { transaction: expect.any(Object) }
      );

      expect(transactionMock.commit).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.arrangement_id).toBe(1);
    });

    test('should throw an error if an existing request is found', async () => {
      const arrangementData = {
        session_type: 'WFH',
        start_date: '2024-10-05',
        staff_id: 1,
      };

      // Mocking findAll to return an existing request
      ArrangementRequest.findAll.mockResolvedValue([{}]);

      await expect(arrangementService.createArrangement(arrangementData)).rejects.toThrow(
        'There is already a WFH request on this date for this staff member.'
      );
    });
  });

  describe('createBatchArrangement', () => {
    test('should create a batch of new arrangements with the same request group', async () => {
      const batchData = {
        staff_id: 1,
        session_type: 'WFH',
        description: 'Weekly work-from-home',
        selected_days: ['Monday', 'Wednesday'],
        num_occurrences: 2,
        repeat_type: 'weekly',
        start_date: '2024-10-01',
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
      expect(result.message).toBe('Batch WFH request created successfully.');
    });
    
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
