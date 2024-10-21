const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const moment = require('moment');
const { Schedule, sequelize } = require('../models'); // Ensure to import your Schedule model

async function seedSchedule() {
  try {
    const scheduleData = [];

    // Read CSV and parse data
    fs.createReadStream(path.resolve(__dirname, 'schedules_mock_data.csv')) // Update CSV file name accordingly
      .pipe(csv())
      .on('data', (row) => {
        scheduleData.push({
          staff_id: parseInt(row.staff_id, 10), // Ensure staff_id is an integer
          start_date: moment(row.start_date, 'YYYY-MM-DD').toDate(), // Convert start_date to proper date format
          session_type: row.session_type,
          description: row.description,
          updated_at: moment(row.updated_at, 'DD/MM/YYYY H:mm').toDate(), // Convert updated_at to proper date format
          request_id: parseInt(row.request_id, 10), // Ensure request_id is an integer
          created_at: new Date(),
        });
      })
      .on('end', async () => {
        try {
          await sequelize.sync(); // Ensure the DB is synced

          // Use bulkCreate with updateOnDuplicate
          await Schedule.bulkCreate(scheduleData, {
            updateOnDuplicate: [
              'staff_id', 'start_date', 'session_type', 'description', 
              'updated_at', 'request_id', 'created_at'
            ]
          });

          console.log('Schedule data inserted/updated successfully!');
        } catch (error) {
          console.error('Error inserting/updating schedule data:', error);
        } finally {
          await sequelize.close(); // Close the connection after seeding
        }
      });
  } catch (error) {
    console.error('Error in seeding process:', error);
  }
}

seedSchedule();
