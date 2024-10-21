const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const { Staff, sequelize } = require('../models');

async function seedStaff() {
  try {
    const hashedPassword = await bcrypt.hash('password', 10); // Hash password

    const staffData = [];

    // Read CSV and parse data
    fs.createReadStream(path.resolve(__dirname, 'employeenew.csv'))
      .pipe(csv())
      .on('data', (row) => {
        staffData.push({
          staff_id: parseInt(row.Staff_ID, 10), // Ensure staff_id is an integer
          staff_fname: row.Staff_FName,
          staff_lname: row.Staff_LName,
          dept: row.Dept,
          position: row.Position,
          country: row.Country,
          email: row.Email,
          reporting_manager_id: parseInt(row.Reporting_Manager, 10),
          hashed_password: hashedPassword,
          role_id: parseInt(row.Role, 10),
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
        });
      })
      .on('end', async () => {
        try {
          await sequelize.sync(); // Ensure the DB is synced

          // Use bulkCreate with updateOnDuplicate
          await Staff.bulkCreate(staffData, {
            updateOnDuplicate: [
              'staff_fname', 'staff_lname', 'dept', 'position', 'country', 'email', 
              'reporting_manager_id', 'hashed_password', 'role_id', 'updated_at', 'is_active'
            ]
          });

          console.log('Staff data inserted/updated successfully!');
        } catch (error) {
          console.error('Error inserting/updating staff data:', error);
        } finally {
          await sequelize.close(); // Close the connection after seeding
        }
      });
  } catch (error) {
    console.error('Error in seeding process:', error);
  }
}

seedStaff();
