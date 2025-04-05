# WFH Management System - SPM Project

[![CI](https://github.com/julian-m-willis/spm-proj/actions/workflows/ci.yml/badge.svg)](https://github.com/julian-m-willis/spm-proj/actions/workflows/ci.yml)
[![CD](https://github.com/julian-m-willis/spm-proj/actions/workflows/cd.yml/badge.svg)](https://github.com/julian-m-willis/spm-proj/actions/workflows/cd.yml)
![Coverage](https://img.shields.io/badge/coverage-97.21%25-brightgreen)

## 🚀 Project Overview
The **WFH Management System** is a full-stack web application that streamlines the work-from-home request process for organizations. Built with modern best practices and a focus on user experience, this system enables employees to manage their WFH requests while providing managers with an efficient approval workflow.

### Key Achievements
- **High Test Coverage**: Achieved 97.21% test coverage through comprehensive unit and integration testing
- **CI/CD Pipeline**: Implemented automated testing and deployment using GitHub Actions
- **Agile Development**: Successfully delivered using Scrum methodology with 2-week sprint cycles
- **Production Ready**: Deployed and running on AWS infrastructure

## ✨ Features
- **User Authentication & Authorization**
  - Secure login system with JWT tokens
  - Role-based access control (Employee/Manager)
  - Session management

- **WFH Request Management**
  - Intuitive request submission interface
  - Real-time status tracking
  - Automated email notifications
  - Calendar integration

- **Manager Dashboard**
  - Streamlined approval workflow
  - Team schedule overview
  - Request analytics and reporting

- **Employee Portal**
  - Personal WFH schedule view
  - Request history
  - Quick request submission

## 🛠️ Tech Stack
### Frontend
- **Framework**: Next.js 13+ with App Router
- **UI Library**: React
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Authentication**: NextAuth.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Email Service**: Mailgun

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Cloud Platform**: AWS
- **Monitoring**: Application Insights

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Docker and Docker Compose
- Git

### Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/julian-m-willis/spm-proj
   cd spm-proj
   ```

2. **Install Dependencies**:
   ```bash
   # Frontend setup
   cd frontend
   npm install
   
   # Backend setup
   cd ../backend
   npm install
   ```

3. **Environment Configuration**:
   Create `.env` files in both frontend and backend directories as described in the [Environment Setup Guide](docs/environment-setup.md)

4. **Database Setup**:
   ```bash
   # Start PostgreSQL container
   docker-compose up -d db
   
   # Run migrations and seed data
   cd backend
   npm run migrate
   npm run seed
   ```

5. **Start Development Servers**:
   ```bash
   # Frontend (in frontend directory)
   npm run dev
   
   # Backend (in backend directory)
   npm run dev
   ```

## 🧪 Testing
The project maintains high code quality through comprehensive testing:

```bash
# Run backend tests with coverage
cd backend
npm run coverage

# Run frontend tests
cd frontend
npm run test
```

## 📊 Project Metrics
- **Code Coverage**: 97.21%
- **Build Time**: < 2 minutes
- **Deployment Time**: < 5 minutes
- **API Response Time**: < 200ms

## 🔒 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- XSS protection
- CORS configuration

## 🌐 Deployment
- **Production URL**: [WFH Management System](http://3.106.143.66/)
- **Demo Credentials**:
  - Email: `derek.tan@allinone.com.sg`
  - Password: `password`

## 📝 Known Limitations
- Email functionality requires Mailgun account setup for production use
- Password reset feature requires email verification for new recipients

## 🤝 Contributing
While this is a school project, suggestions and improvements are welcome. Please feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📞 Contact
For questions or collaboration opportunities, reach out to:
- [Julian Maximillian Willis](mailto:jmwillis.2022@business.smu.edu.sg)
- LinkedIn: [Your LinkedIn Profile]
- GitHub: [@julian-m-willis](https://github.com/julian-m-willis)

## 📄 License
This project was developed as part of an SMU Software Project Management module assignment. All rights reserved.
