// const arrangementService = require('../../services/arrangementService');
// const sequelize = require('../../models').sequelize;  // Import sequelize instance for transactions

// Mock the `RequestGroup` and `Arrangement` models
jest.mock('../../models', () => ({
    ArrangementRequest: {
        findAll: jest.fn(),
        create: jest.fn()
    },
    RequestGroup: {
        create: jest.fn(),
      },
    sequelize: {
        transaction: jest.fn(() => ({
            commit: jest.fn(),
            rollback: jest.fn(),
        })),
    }
}));


// const { Arrangement, RequestGroup } = require('../../models');

const { ArrangementRequest, RequestGroup, sequelize } = require('../../models');
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
});
