const { Staff } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

exports.login = async (email, password) => {
  const staff = await Staff.findOne({ where: { email } });
  if (!staff || !bcrypt.compareSync(password, staff.hashed_password)) {
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ staff_id: staff.staff_id, role: staff.role_id }, JWT_SECRET, { expiresIn: '1h' });
  // return token;
  return {
    "token": token,
    "user": {
      "id": staff.staff_id,
      "role": staff.role_id,
      "name": staff.staff_fname + ' ' + staff.staff_lname,
      "dept": staff.dept,
      "position": staff.position,
    }
  };
};
