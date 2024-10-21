const scheduleService = require('../../services/scheduleService');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Mock the `Staff` and `Schedule` models
jest.mock('../../models', () => ({
    Staff: {
        findAll: jest.fn(),
        findOne: jest.fn()
    },
    Schedule: {
        findAll: jest.fn(),
        create: jest.fn()
    },
    ArrangementRequest: {
        findAll: jest.fn(),
    },
    RequestGroup: {
        findOne: jest.fn(),
    }
}));

const { Staff, Schedule, ArrangementRequest, RequestGroup } = require('../../models');

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

    describe('getScheduleGlobal', () => {
        test('should retrieve Global schedules', async () => {
            const staff_id = 1;
            const departmentname = 'Engineering';
            const position = 'Developer';
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

            // Mock data for `Staff.findOne`
            const staffData1 = { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position };

            // Mock data for `Staff.findAll`
            const staffData = [
                { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position },
                { staff_id: 2, staff_fname: 'Jane', staff_lname: 'Smith', dept: departmentname, position }
            ];
            
            const scheduleData = [
                { staff_id: 1, start_date: '2023-10-02', session_type: 'Work from home', Staff: staffData[0]},
                { staff_id: 2, start_date: '2023-10-02', session_type: 'Work from home (AM)', Staff: staffData[1]},
                { staff_id: 1, start_date: '2023-10-03', session_type: 'Work from home (PM)', Staff: staffData[0]},
                { staff_id: 2, start_date: '2023-10-03', session_type: 'Pending', Staff: staffData[1]}
            ];
            
            // Set up mocks
            Schedule.findAll.mockResolvedValue(scheduleData);
            Staff.findOne.mockResolvedValue(staffData1);
            Staff.findAll.mockResolvedValue(staffData);

            const result = await scheduleService.getScheduleGlobal({ start_date, end_date });
            console.log(result);
            expect(Staff.findAll).toHaveBeenCalledWith({
                where: {
                    }
                }
            );

            const startDate = dayjs(start_date).startOf('day').toDate();  
            const endDate = dayjs(end_date).endOf('day').toDate();   
            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: startDate, [Op.lte]: endDate }
                },
                include: [
                    {
                        model: Staff,
                        where: {
                        },
                    }
                ]
            });

            const expectedOutput = {
                '2023-10-02': {
                    'Engineering': {
                        'Developer': {
                            'In office': [],
                            'Work from home': ['John Doe'],
                            'Work from home (AM)': ['Jane Smith'],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-03': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': ['John Doe'],
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
                }
            };

            expect(result).toEqual(expectedOutput);
        });
    });
    
    describe('getScheduleByDepartment', () => {
        test('should retrieve schedules by department', async () => {
            const staff_id = 1;
            const departmentname = 'Engineering';
            const position = 'Developer';
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

            // Mock data for `Staff.findOne`
            const staffData1 = { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position };

            // Mock data for `Staff.findAll`
            const staffData = [
                { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position },
                { staff_id: 2, staff_fname: 'Jane', staff_lname: 'Smith', dept: departmentname, position }
            ];
            
            const scheduleData = [
                { staff_id: 1, start_date: '2023-10-02', session_type: 'Work from home', Staff: staffData[0]},
                { staff_id: 2, start_date: '2023-10-02', session_type: 'Work from home (AM)', Staff: staffData[1]},
                { staff_id: 1, start_date: '2023-10-03', session_type: 'Work from home (PM)', Staff: staffData[0]},
                { staff_id: 2, start_date: '2023-10-03', session_type: 'Pending', Staff: staffData[1]}
            ];
            
            // Set up mocks
            Schedule.findAll.mockResolvedValue(scheduleData);
            Staff.findOne.mockResolvedValue(staffData1);
            Staff.findAll.mockResolvedValue(staffData);

            const result = await scheduleService.getScheduleByDepartment({ staff_id, start_date, end_date });
            console.log(result);
            expect(Staff.findAll).toHaveBeenCalledWith({
                where: {
                    dept: departmentname,
                    position: {
                        [Op.ne]: "Director",
                    }
                }
            });

            const startDate = dayjs(start_date).startOf('day').toDate();  
            const endDate = dayjs(end_date).endOf('day').toDate();   
            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: startDate, [Op.lte]: endDate }
                },
                include: [
                    {
                        model: Staff,
                        where: {
                            dept: departmentname,
                        },
                    }
                ]
            });

            const expectedOutput = {
                '2023-10-02': {
                    'Engineering': {
                        'Developer': {
                            'In office': [],
                            'Work from home': ['John Doe'],
                            'Work from home (AM)': ['Jane Smith'],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-03': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['Jane Smith'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': ['John Doe'],
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
                }
            };

            expect(result).toEqual(expectedOutput);
        });

        test('should handle no schedules for staff', async () => {
            const staff_id = 1;
            const departmentname = 'Engineering';
            const position = 'Developer';
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

            // Mock data for `Staff.findOne`
            const staffData1 = { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position };

            // Mock data for `Staff.findAll`
            const staffData = [
                { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position },
                { staff_id: 2, staff_fname: 'Jane', staff_lname: 'Smith', dept: departmentname, position }
            ];
            
            const scheduleData = [];
            
            // Set up mocks
            Schedule.findAll.mockResolvedValue(scheduleData);
            Staff.findOne.mockResolvedValue(staffData1);
            Staff.findAll.mockResolvedValue(staffData);

            const result = await scheduleService.getScheduleByDepartment({ staff_id, start_date, end_date });
            console.log(result);
            expect(Staff.findAll).toHaveBeenCalledWith({
                where: {
                    dept: departmentname,
                    position: {
                        [Op.ne]: "Director",
                    }
                }
            });

            const startDate = dayjs(start_date).startOf('day').toDate();  
            const endDate = dayjs(end_date).endOf('day').toDate();   
            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: startDate, [Op.lte]: endDate }
                },
                include: [
                    {
                        model: Staff,
                        where: {
                            dept: departmentname,
                        },
                    }
                ]
            });

            const expectedOutput = {
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
                }
            };

            expect(result).toEqual(expectedOutput);
        });
    });

    describe('getScheduleByTeam', () => {
        test('should retrieve schedules by team', async () => {
            const staff_id = 1;
            const departmentname = 'Engineering';
            const position = 'Developer';
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

            // Mock data for `Staff.findOne`
            const staffData1 = { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position };

            // Mock data for `Staff.findAll`
            const staffData = [
                { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position },
                { staff_id: 2, staff_fname: 'Jane', staff_lname: 'Smith', dept: departmentname, position }
            ];
            
            const scheduleData = [
                { staff_id: 1, start_date: '2023-10-02', session_type: 'Work from home', Staff: staffData[0]},
                { staff_id: 2, start_date: '2023-10-02', session_type: 'Work from home (AM)', Staff: staffData[1]},
                { staff_id: 2, start_date: '2023-10-03', session_type: 'Work from home (PM)', Staff: staffData[1]},
                { staff_id: 1, start_date: '2023-10-03', session_type: 'Pending', Staff: staffData[0]},
            ];
            
            // Set up mocks
            Schedule.findAll.mockResolvedValue(scheduleData);
            Staff.findOne.mockResolvedValue(staffData1);
            Staff.findAll.mockResolvedValue(staffData);


            const result = await scheduleService.getScheduleByTeam({ staff_id, start_date, end_date });
            console.log(result);
            expect(Staff.findAll).toHaveBeenCalledWith({
                where: {
                    dept: departmentname,
                    ...(position && { position })
                }
            });

            const startDate = dayjs(start_date).startOf('day').toDate();  
            const endDate = dayjs(end_date).endOf('day').toDate();   
            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: startDate, [Op.lte]: endDate }
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
                '2023-10-02': {
                    'Engineering': {
                        'Developer': {
                            'In office': [],
                            'Work from home': ['John Doe'],
                            'Work from home (AM)': ['Jane Smith'],
                            'Work from home (PM)': [],
                        }
                    }
                },
                '2023-10-03': {
                    'Engineering': {
                        'Developer': {
                            'In office': ['John Doe'],
                            'Work from home': [],
                            'Work from home (AM)': [],
                            'Work from home (PM)': ['Jane Smith'],
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
                }
            };

            expect(result).toEqual(expectedOutput);
        });


        test('should handle no schedules for staff', async () => {
            const staff_id = 1;
            const departmentname = 'Engineering';
            const position = 'Developer';
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

             // Mock data for `Staff.findOne`
            const staffData1 = { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position };

            const staffData = [
                { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe', dept: departmentname, position: position },
                { staff_id: 2, staff_fname: 'Jane', staff_lname: 'Smith', dept: departmentname, position: position }
            ];

            Staff.findAll.mockResolvedValue(staffData);
            Staff.findOne.mockResolvedValue(staffData1); 
            Schedule.findAll.mockResolvedValue([]);

            const result = await scheduleService.getScheduleByTeam({ staff_id, start_date, end_date });

            expect(Staff.findAll).toHaveBeenCalledWith({
                where: {
                    dept: departmentname,
                    ...(position && { position })
                }
            });

            const startDate = dayjs(start_date).startOf('day').toDate();  
            const endDate = dayjs(end_date).endOf('day').toDate();   
            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: startDate, [Op.lte]: endDate }
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
                }
            };

            expect(result).toEqual(expectedOutput);
        });

    });

    describe('getSchedulePersonal', () => {
        test('should retrieve own schedules', async () => {
            const staff_id = 1;
            const start_date = '2023-10-01';
            const end_date = '2023-10-07';

            // Mock data for `Staff.findOne`
            const staffData = { staff_id: 1, staff_fname: 'John', staff_lname: 'Doe' };

            // Mock data for `Schedule.findAll`
            const scheduleData = [
                { staff_id: 1, start_date: '2023-10-02', session_type: 'Work from home' },
                { staff_id: 1, start_date: '2023-10-03', session_type: 'Work from home (AM)' },
                { staff_id: 1, start_date: '2023-10-04', session_type: 'Work from home (PM)' }
            ];

            // Mock data for `ArrangementRequest.findAll`
            const pendingRequestsData = [
                { start_date: '2023-10-05', request_status: 'Pending', RequestGroup: { staff_id: 1 } }
            ];

            // Set up mocks
            Staff.findOne.mockResolvedValue(staffData);
            Schedule.findAll.mockResolvedValue(scheduleData);
            ArrangementRequest.findAll.mockResolvedValue(pendingRequestsData);

            const result = await scheduleService.getSchedulePersonal({ staff_id, start_date, end_date });

            const startDate = dayjs(start_date).startOf('day').toDate();
            const endDate = dayjs(end_date).endOf('day').toDate();

            expect(Schedule.findAll).toHaveBeenCalledWith({
                where: {
                    start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
                    staff_id,
                },
            });

            expect(ArrangementRequest.findAll).toHaveBeenCalledWith({
                where: {
                    request_status: 'Pending',
                    start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
                },
                include: [
                    {
                        model: RequestGroup,
                        where: { staff_id },
                    }
                ],
            });

            const expectedOutput = {
                staff_id: 1,
                schedules: {
                    "2023-10-02": "Work from home",
                    "2023-10-03": "Work from home (AM)",
                    "2023-10-04": "Work from home (PM)",
                    "2023-10-05": "Pending Arrangement Request",
                    "2023-10-06": "In office"
                }
            };

            expect(result).toEqual(expectedOutput);
        });
    });
});
