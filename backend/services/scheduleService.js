const { Schedule, Staff, ArrangementRequest, RequestGroup } = require('../models');
const dayjs = require("dayjs");
const { Op } = require('sequelize');
const moment = require('moment');
const staff = require('../models/staff');

const isWeekend = (date) => {
  const day = moment(date).day(); // 0 (Sunday) to 6 (Saturday)
  return day === 0 || day === 6;
};

exports.createSchedule = async (data) => {
  return await Schedule.create(data);
};

exports.getSchedulePersonal = async ({ staff_id, start_date, end_date }) => {
  // 1. Retrieve the current logged-in staff
  const currstaffQuery = {
    where: {
      staff_id,
    },
  };

  const currStaff = await Staff.findOne(currstaffQuery);

  // 2. Retrieve schedules for current staff within the date range
  const startDate = dayjs(start_date).startOf('day').toDate();  
  const endDate = dayjs(end_date).endOf('day').toDate();    

  const scheduleQuery = {
    where: {
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
      staff_id,
    },
  };

  const schedules = await Schedule.findAll(scheduleQuery);

  // 3. Check for pending arrangement requests within the date range by joining RequestGroup and filtering by staff_id
  const pendingRequests = await ArrangementRequest.findAll({
    where: {
      request_status: 'Pending', // Assuming 'pending' is the status for requests awaiting approval
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    include: [{
      model: RequestGroup,
      where: {
        staff_id, // Filter based on the staff_id from the joined RequestGroup
      },
    }],
  });

  // Helper function to generate all dates between start_date and end_date
  const generateDateRange = (start, end) => {
    let currentDate = moment(start);
    const endDate = moment(end);
    const dates = [];

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) { // Only include non-weekend dates
        dates.push(currentDate.format('YYYY-MM-DD'));
      }
      currentDate = currentDate.add(1, 'days');
    }

    return dates;
  };

  const allDates = generateDateRange(start_date, end_date);

  // Initialize an empty result object to hold the formatted output
  const result = {};

  // Create a lookup table for schedules by staff and date
  const scheduleLookup = {};
  schedules.forEach(schedule => {
    const dateKey = moment(schedule.start_date).format('YYYY-MM-DD');
    if (!scheduleLookup[dateKey]) {
      scheduleLookup[dateKey] = {
        session_type: schedule.session_type,
      };
    }
  });

  // Create a lookup table for pending arrangement requests by date
  const pendingRequestLookup = {};
  pendingRequests.forEach(request => {
    const dateKey = moment(request.start_date).format('YYYY-MM-DD');
    pendingRequestLookup[dateKey] = 'Pending Arrangement Request';
  });

  allDates.forEach(date => {
    if (!result[date]) {
      result[date] = ""; // Ensure date key exists
    }

    if (pendingRequestLookup[date]) {
      result[date] = pendingRequestLookup[date]; // Mark as pending request
    } else if (scheduleLookup[date]) {
      const scheduleForDate = scheduleLookup[date];

      // Push to either "Work from home" or "In office" based on session_type
      if (scheduleForDate.session_type === "Work from home") {
        result[date] = "Work from home";
      } else if (scheduleForDate.session_type === "Work from home (AM)") {
        result[date] = "Work from home (AM)";
      } else if (scheduleForDate.session_type === "Work from home (PM)") {
        result[date] = "Work from home (PM)";
      } else {
        result[date] = "In office";
      }
    } else {
      result[date] = "In office";
    }
  });

  return {
    staff_id: staff_id,
    schedules: result,
  };
};




exports.getScheduleByTeam = async ({ staff_id, start_date, end_date }) => {
  // 0. Retrieve the current logged-in staff
  const currstaffQuery = {
    where: {
      staff_id,
    },
  };

  const currStaff = await Staff.findOne(currstaffQuery);
  const position = currStaff.position;
  const department = currStaff.dept;

  // 1. Retrieve all staff members with the same position
  const staffQuery = {
    where: {
      dept: department,
      position,
    },
  };

  const allStaff = await Staff.findAll(staffQuery);
  

  // 2. Retrieve schedules for staff in the department within the date range
  const startDate = dayjs(start_date).startOf('day').toDate();  
  const endDate = dayjs(end_date).endOf('day').toDate();    
  const scheduleQuery = {
    where: {
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    include: [
      {
        model: Staff,
        where: {
          dept: department,
          position,
        },
      },
    ],
  };

  const schedules = await Schedule.findAll(scheduleQuery);

  // Helper function to generate all dates between start_date and end_date
  const generateDateRange = (start, end) => {
    let currentDate = moment(start);
    const endDate = moment(end);
    const dates = [];

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) { // Only include non-weekend dates
        dates.push(currentDate.format('YYYY-MM-DD'));
      }
      currentDate = currentDate.add(1, 'days');
    }

    return dates;
  };

  // Get all dates between start_date and end_date
  const allDates = generateDateRange(start_date, end_date);

  // Initialize an empty result object to hold the formatted output
  const result = {};

  // Initialize the structure with all dates, department, and position fields
  allDates.forEach(date => {
    result[date] = {};
  });

  // Create a lookup table for schedules by staff and date
  const scheduleLookup = {};

  const positionKey = position;
  const departmentKey = department;

  schedules.forEach(schedule => {
    const dateKey = moment(schedule.start_date).format('YYYY-MM-DD');
    const staffId = schedule.staff_id;
    const name = `${schedule.Staff.staff_fname} ${schedule.Staff.staff_lname}`;

    if (!scheduleLookup[staffId]) {
      scheduleLookup[staffId] = {};
    }

    if (!scheduleLookup[staffId][dateKey]) {
      scheduleLookup[staffId][dateKey] = {
        position: positionKey,
        department: departmentKey,
        session_type: schedule.session_type,
        name: name,
      };
    }
  });

  // 3. Populate result based on the schedule or default as "In office"
  allStaff.forEach(staff => {
    const staffName = `${staff.staff_fname} ${staff.staff_lname}`;
    const positionKey = staff.position;
    const departmentKey = staff.dept;

    allDates.forEach(date => {
  
      if (!result[date][departmentKey]) {
        result[date][departmentKey] = {}; // Ensure department key exists
      }
  
      if (!result[date][departmentKey][positionKey]) {
        result[date][departmentKey][positionKey] = {
          "In office": [],
          "Work from home": [],
          "Work from home (AM)": [],
          "Work from home (PM)": [],
        }; 
      }

      // Check if staff has a schedule for this date
      if (scheduleLookup[staff.staff_id] && scheduleLookup[staff.staff_id][date]) {
        const scheduleForDate = scheduleLookup[staff.staff_id][date];

        // Push to either "Work from home" or "In office" based on session_type
        if (scheduleForDate.session_type === "Work from home") {
          result[date][departmentKey][positionKey]["Work from home"].push(staffName);
        }else if (scheduleForDate.session_type === "Work from home (AM)") {
          result[date][departmentKey][positionKey]["Work from home (AM)"].push(staffName);
        }else if (scheduleForDate.session_type === "Work from home (PM)") {
          result[date][departmentKey][positionKey]["Work from home (PM)"].push(staffName);
        }else {
          result[date][departmentKey][positionKey]["In office"].push(staffName);
        }
      } else {
        // If no schedule, default to "In office"
        result[date][departmentKey][positionKey]["In office"].push(staffName);
      }
    });
  });
  return result;
};

exports.getScheduleByDepartment = async ({ staff_id, start_date, end_date }) => {
  // 0. Retrieve the current logged-in staff
  const currstaffQuery = {
    where: {
      staff_id,
    },
  };

  const currStaff = await Staff.findOne(currstaffQuery);
  const position = currStaff.position;
  const departmentname = currStaff.dept;
  
  // 1. Retrieve all staff members from the department (filtered by position if provided)
  const staffQuery = {
    where: {
      dept: departmentname, // Filter by department name if provided
      position: {
        [Op.ne]: "Director", // Exclude position "Director"
      },
    },
  };

  const allStaff = await Staff.findAll(staffQuery);
  
  // 2. Retrieve schedules for staff in the department within the date range
  const startDate = dayjs(start_date).startOf('day').toDate();  
  const endDate = dayjs(end_date).endOf('day').toDate();    
  const scheduleQuery = {
    where: {
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    include: [
      {
        model: Staff,
        where: {
          ...(departmentname && { dept: departmentname }),
        },
      },
    ],
  };

  const schedules = await Schedule.findAll(scheduleQuery);

  // Helper function to generate all dates between start_date and end_date
  const generateDateRange = (start, end) => {
    let currentDate = moment(start);
    const endDate = moment(end);
    const dates = [];

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) { // Only include non-weekend dates
        dates.push(currentDate.format('YYYY-MM-DD'));
      }
      currentDate = currentDate.add(1, 'days');
    }

    return dates;
  };

  // Get all dates between start_date and end_date
  const allDates = generateDateRange(start_date, end_date);

  // Initialize an empty result object to hold the formatted output
  const result = {};

  // Initialize the structure with all dates, department, and position fields
  allDates.forEach(date => {
    result[date] = {};
  });

  // Create a lookup table for schedules by staff and date
  const scheduleLookup = {};

  schedules.forEach(schedule => {
    const dateKey = moment(schedule.start_date).format('YYYY-MM-DD');
    const staffId = schedule.staff_id;
    const positionKey = schedule.Staff.position;
    const departmentKey = schedule.Staff.dept;
    const name = `${schedule.Staff.staff_fname} ${schedule.Staff.staff_lname}`;

    if (!scheduleLookup[staffId]) {
      scheduleLookup[staffId] = {};
    }

    if (!scheduleLookup[staffId][dateKey]) {
      scheduleLookup[staffId][dateKey] = {
        position: positionKey,
        department: departmentKey,
        session_type: schedule.session_type,
        name: name,
      };
    }
  });

  // 3. Populate result based on the schedule or default as "In office"
  allStaff.forEach(staff => {
    const staffName = `${staff.staff_fname} ${staff.staff_lname}`;
    const positionKey = staff.position;
    const departmentKey = staff.dept;

    allDates.forEach(date => {
  
      if (!result[date][departmentKey]) {
        result[date][departmentKey] = {}; // Ensure department key exists
      }
  
      if (!result[date][departmentKey][positionKey]) {
        result[date][departmentKey][positionKey] = {
          "In office": [],
          "Work from home": [],
          "Work from home (AM)": [],
          "Work from home (PM)": [],
        }; 
      }

      // Check if staff has a schedule for this date
      if (scheduleLookup[staff.staff_id] && scheduleLookup[staff.staff_id][date]) {
        const scheduleForDate = scheduleLookup[staff.staff_id][date];

        // Push to either "Work from home" or "In office" based on session_type
        if (scheduleForDate.session_type === "Work from home") {
          result[date][departmentKey][positionKey]["Work from home"].push(staffName);
        }else if (scheduleForDate.session_type === "Work from home (AM)") {
          result[date][departmentKey][positionKey]["Work from home (AM)"].push(staffName);
        }else if (scheduleForDate.session_type === "Work from home (PM)") {
          result[date][departmentKey][positionKey]["Work from home (PM)"].push(staffName);
        }else {
          result[date][departmentKey][positionKey]["In office"].push(staffName);
        }
      } else {
        // If no schedule, default to "In office"
        result[date][departmentKey][positionKey]["In office"].push(staffName);
      }
    });
  });
  return result;
};

exports.getScheduleGlobal = async ({ departmentname, position, start_date, end_date }) => {
  // 1. Retrieve all staff members from the department (filtered by position if provided)
  const staffQuery = {
    where: {
      ...(departmentname && { dept: departmentname }),
      ...(position && { position }), // Add position filter if provided
    },
  };

  const allStaff = await Staff.findAll(staffQuery);
  

  // 2. Retrieve schedules for staff in the department within the date range
  const startDate = dayjs(start_date).startOf('day').toDate();  
  const endDate = dayjs(end_date).endOf('day').toDate();    
  const scheduleQuery = {
    where: {
      start_date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    include: [
      {
        model: Staff,
        where: {
          ...(departmentname && { dept: departmentname }),
          ...(position && { position }),
        },
      },
    ],
  };

  const schedules = await Schedule.findAll(scheduleQuery);

  // Helper function to generate all dates between start_date and end_date
  const generateDateRange = (start, end) => {
    let currentDate = moment(start);
    const endDate = moment(end);
    const dates = [];

    while (currentDate <= endDate) {
      if (!isWeekend(currentDate)) { // Only include non-weekend dates
        dates.push(currentDate.format('YYYY-MM-DD'));
      }
      currentDate = currentDate.add(1, 'days');
    }

    return dates;
  };

  // Get all dates between start_date and end_date
  const allDates = generateDateRange(start_date, end_date);

  // Initialize an empty result object to hold the formatted output
  const result = {};

  // Initialize the structure with all dates, department, and position fields
  allDates.forEach(date => {
    result[date] = {};
  });

  // Create a lookup table for schedules by staff and date
  const scheduleLookup = {};

  schedules.forEach(schedule => {
    const dateKey = moment(schedule.start_date).format('YYYY-MM-DD');
    const staffId = schedule.staff_id;
    const positionKey = schedule.Staff.position;
    const departmentKey = schedule.Staff.dept;
    const name = `${schedule.Staff.staff_fname} ${schedule.Staff.staff_lname}`;

    if (!scheduleLookup[staffId]) {
      scheduleLookup[staffId] = {};
    }

    if (!scheduleLookup[staffId][dateKey]) {
      scheduleLookup[staffId][dateKey] = {
        position: positionKey,
        department: departmentKey,
        session_type: schedule.session_type,
        name: name,
      };
    }
  });

  // 3. Populate result based on the schedule or default as "In office"
  allStaff.forEach(staff => {
    const staffName = `${staff.staff_fname} ${staff.staff_lname}`;
    const positionKey = staff.position;
    const departmentKey = staff.dept;

    allDates.forEach(date => {
  
      if (!result[date][departmentKey]) {
        result[date][departmentKey] = {}; // Ensure department key exists
      }
  
      if (!result[date][departmentKey][positionKey]) {
        result[date][departmentKey][positionKey] = {
          "In office": [],
          "Work from home": [],
          "Work from home (AM)": [],
          "Work from home (PM)": [],
        }; 
      }

      // Check if staff has a schedule for this date
      if (scheduleLookup[staff.staff_id] && scheduleLookup[staff.staff_id][date]) {
        const scheduleForDate = scheduleLookup[staff.staff_id][date];

        // Push to either "Work from home" or "In office" based on session_type
        if (scheduleForDate.session_type === "Work from home") {
          result[date][departmentKey][positionKey]["Work from home"].push(staffName);
        }else if (scheduleForDate.session_type === "Work from home (AM)") {
          result[date][departmentKey][positionKey]["Work from home (AM)"].push(staffName);
        }else if (scheduleForDate.session_type === "Work from home (PM)") {
          result[date][departmentKey][positionKey]["Work from home (PM)"].push(staffName);
        }else {
          result[date][departmentKey][positionKey]["In office"].push(staffName);
        }
      } else {
        // If no schedule, default to "In office"
        result[date][departmentKey][positionKey]["In office"].push(staffName);
      }
    });
  });
  return result;
};