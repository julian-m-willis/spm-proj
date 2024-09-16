const { Staff, sequelize } = require('../models'); // Make sure sequelize is imported
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    await sequelize.sync(); // Sync database to ensure tables exist

    // Dummy data
    const hashedPassword = await bcrypt.hash('password', 10);

    await Staff.bulkCreate([
      {
        staff_fname: 'John',
        staff_lname: 'Doe',
        dept: 'Engineering',
        position: 'Developer',
        country: 'USA',
        email: 'john.doe@example.com',
        hashed_password: hashedPassword,
        is_active: true,
      },
      {
        staff_fname: 'Jane',
        staff_lname: 'Smith',
        dept: 'Marketing',
        position: 'Manager',
        country: 'USA',
        email: 'jane.smith@example.com',
        hashed_password: hashedPassword,
        is_active: true,
      },
    ]);

    console.log('Dummy data inserted');
  } catch (error) {
    console.error('Error inserting dummy data:', error);
  }
};

seedData();
