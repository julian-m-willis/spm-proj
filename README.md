# WFH Management System - SPM Project

[![CI](https://github.com/julian-m-willis/spm-proj/actions/workflows/ci.yml/badge.svg)](https://github.com/julian-m-willis/spm-proj/actions/workflows/ci.yml)
[![CD](https://github.com/julian-m-willis/spm-proj/actions/workflows/cd.yml/badge.svg)](https://github.com/julian-m-willis/spm-proj/actions/workflows/cd.yml)
![Coverage](https://img.shields.io/badge/coverage-97.21%25-brightgreen)


## Project Description
The **WFH Management System** is designed for employees to apply for work-from-home (WFH) days, view schedules, and for managers to approve or reject requests. This system was developed over 8 weeks as part of the SMU Software Project Management module, using Agile methodology with Scrum and Sprints.

## Table of Contents
- [Project Description](#project-description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation and Setup](#installation-and-setup)
- [Deployement](#deployement)
- [Testing](#testing)
- [Known Issues and Limitations](#known-issues-and-limitations)
- [Contact](#contact)
- [License](#license)

## Features
- **Employee WFH Requests**: Employees can apply for WFH days.
- **View Schedules**: Check the WFH schedule.
- **Approval System**: Managers can approve or reject WFH requests.
- **Role-based Access**: Different levels of access based on user roles.

## Tech Stack
- **Frontend**: React, Next.js
- **Backend**: Express.js
- **Database**: PostgreSQL (can be run in Docker for simplicity)

## Installation and Setup
### Prerequisites
- **Node.js**: Ensure you have Node.js installed (you can check your Node.js version with `node -v`).
- **Docker**: For running PostgreSQL in a container.

### Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/julian-m-willis/spm-proj
   cd spm-proj
   ```
2. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   cd backend
   npm install
   ```
3. **Set Up Environment Variables**:
   Create a `.env` file in the backend directory and configure the following variables:

   ```dotenv
   DB_HOST=<database-host>
   DB_PORT=<database-port>
   DB_USER=<database-username>
   DB_PASSWORD=<database-password>
   DB_NAME=<database-name>
   JWT_SECRET=<your-jwt-secret>
   ```

   - **DB_HOST**: PostgreSQL database host (use Docker’s IP if running locally).
   - **DB_PORT**: Database port (default PostgreSQL port is `5432`).
   - **DB_USER**: Database username.
   - **DB_PASSWORD**: Database password.
   - **DB_NAME**: Name of the PostgreSQL database.
   - **JWT_SECRET**: Secret key for JWT token generation.
  
      Create a `.env.local` file in the frontend directory and configure the following variables:

   ```dotenv
    AUTH_SECRET="<>
    NEXTAUTH_URL="http://localhost:3000"
    NEXT_PUBLIC_API_URL="http://localhost:3001"
   ```

   - **AUTH_SECRET**: OAuth Secret for Ecryption.
   - **NEXTAUTH_URL**: Frontend URL.
   - **NEXT_PUBLIC_API_URL**: Backend URL for API Calls.

### Seeding Database
To seed the user accounts with sample data, run:
```bash
cd backend
npm run seed
```

This command will populate the database with initial user accounts to test the application.

## Deployement
- **URL**: [Project URL](http://3.106.143.66/)
- **Authentication**:
  - **Email**: `derek.tan@allinone.com.sg`
  - **Password**: `password`

## Testing
To run tests and view coverage for the backend, use:
```bash
cd backend
npm run coverage
```

## Known Issues and Limitations
- **Forget Password**: The “Forget Password” feature on the Sign-In Page cannot send reset emails to actual email addresses (e.g., `derek.tan@allinone.com.sg`). This limitation arises because the free version of the Mailgun API requires recipients to accept an agreement before they can be added to the contact list and receive emails.

## Contact
For questions or support, please contact [Julian Maximillian Willis](mailto:jmwillis.2022@business.smu.edu.sg).

## License
This project was developed as part of an SMU school assignment. No specific license is applied.
