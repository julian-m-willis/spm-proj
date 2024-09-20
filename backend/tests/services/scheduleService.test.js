const scheduleService = require('../../services/scheduleService');
const { Op } = require('sequelize');

// Mock the `Staff` and `Schedule` models
jest.mock('../../models', () => ({
    Staff: {
        findAll: jest.fn()
    },
    Schedule: {
        findAll: jest.fn(),
        create: jest.fn()
    }
}));

const { Staff, Schedule } = require('../../models');

describe('Schedule Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createSchedule', () => {
        test('should create a new schedule', async () => {
            const scheduleData = { staff_id: 1, start_date: '2023-10-01', end_date: '2023-10-01', session_type: 'In office' };
            Schedule.create.mockResolvedValue(scheduleData);

            const result = await scheduleService.createSchedule(scheduleData);

            expect(Schedule.create).toHaveBeenCalledWith(scheduleData);
            expect(result).toEqual(scheduleData);
        });
    });

    describe('getScheduleByDepartment', () => {
        test('should retrieve schedules by department', async () => {
            const departmentname = 'Engineering';
            const position = 'Developer';
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

            // Mock data for `Staff.findAll`
            const staffData = [
                { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position },
                { staff_id: 2, staff_fname: 'Jane', staff_lname: 'Smith', dept: departmentname, position }
            ];
            
            const scheduleData = [
                { staff_id: 1, start_date: '2023-10-01', session_type: 'Work from home', Staff: staffData[0]},
                { staff_id: 2, start_date: '2023-10-02', session_type: 'Work from home', Staff: staffData[1]}
            ];
            
            // Set up mocks
            Schedule.findAll.mockResolvedValue(scheduleData);
            Staff.findAll.mockResolvedValue(staffData);


            const result = await scheduleService.getScheduleByDepartment({ departmentname, position, start_date, end_date });
            console.log(result);
            expect(Staff.findAll).toHaveBeenCalledWith({
                where: {
                    dept: departmentname,
                    ...(position && { position })
                }
            });

            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: start_date, [Op.lte]: end_date }
                },
                include: [
                    {
                        model: Staff,
                        where: {
                            dept: departmentname,
                            ...(position && { position }),
                        },
                    }
                ]
            });

            const expectedOutput = {
                '2023-10-01': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['Jane Smith'],
                            'Work from home': ['John Doe'],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-02': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe'],
                            'Work from home': ['Jane Smith'],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-03': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-04': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-05': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-06': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-07': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                }
            };

            expect(result).toEqual(expectedOutput);
        });

        test('should handle no staff in department', async () => {
            const departmentname = 'Engineering';
            const position = 'Developer';
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

            Staff.findAll.mockResolvedValue([]);
            Schedule.findAll.mockResolvedValue([]);

            const result = await scheduleService.getScheduleByDepartment({ departmentname, position, start_date, end_date });

            expect(Staff.findAll).toHaveBeenCalledWith({
                where: {
                    dept: departmentname,
                    ...(position && { position })
                }
            });

            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: start_date, [Op.lte]: end_date }
                },
                include: [
                    {
                        model: Staff,
                        where: {
                            dept: departmentname,
                            ...(position && { position }),
                        },
                    }
                ]
            });

            const expectedOutput = {
                '2023-10-01': {},
                '2023-10-02': {},
                '2023-10-03': {},
                '2023-10-04': {},
                '2023-10-05': {},
                '2023-10-06': {},
                '2023-10-07': {}
            };

            expect(result).toEqual(expectedOutput);
        });

        test('should handle no schedules for staff', async () => {
            const departmentname = 'Engineering';
            const position = 'Developer';
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

            const staffData = [
                { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position: position },
                { staff_id: 2, staff_fname: 'Jane', staff_lname: 'Smith', dept: departmentname, position: position }
            ];

            Staff.findAll.mockResolvedValue(staffData);
            Schedule.findAll.mockResolvedValue([]);

            const result = await scheduleService.getScheduleByDepartment({ departmentname, position, start_date, end_date });

            expect(Staff.findAll).toHaveBeenCalledWith({
                where: {
                    dept: departmentname,
                    ...(position && { position })
                }
            });

            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: start_date, [Op.lte]: end_date }
                },
                include: [
                    {
                        model: Staff,
                        where: {
                            dept: departmentname,
                            ...(position && { position }),
                        },
                    }
                ]
            });

            const expectedOutput = {
                '2023-10-01': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-02': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-03': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-04': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-05': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-06': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-07': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe', 'Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': [],
                        }
                    }
                }
            };

            expect(result).toEqual(expectedOutput);
        });
    });
});
