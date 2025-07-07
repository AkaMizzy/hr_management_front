# HR Management System

## Project Overview
The HR Management System is a web application designed to streamline human resources operations within an organization. The system consists of a React-based frontend and a Node.js/Express backend with a MySQL database.

## Key Features
- Role-based authentication and authorization (Employee, Manager, Responsable RH)
- Employee dashboard for personal information management
- Manager dashboard for employee management, document management and many more.
- HR dashboard for organization-wide HR operations
- Attestation request and approval workflow
- entity management
- task management

## Project Structure

### Frontend (`hr_frontend`)
```
hr_frontend/
├── public/               # Static assets
├── src/
│   ├── api/              # API connection utilities
│   ├── Components/
│   │   ├── Assets/  
│   │   ├── auth/         # Authentication components
│   │   ├── employee_dashboard/
│   │   │   ├──  # Employee components
│   │   │   └── ...
│   │   ├── Manager/
│   │   │   ├──  # Manager components
│   │   │   └── ...
│   │   ├── rh_dashboard/
│   │   │   ├──  # RH  components
│   │   │   └── ...
│   │   └── ...
│   ├── App.js            # Main application component with routes
│   └── index.js          # Application entry point
├── package.json          # Frontend dependencies
└── README.md             # Frontend documentation
```

### Backend (`hr_backend`)
```
hr_backend/
├── config/               # Database and configuration files
├── routes/
│   ├── attestations.js   # Attestation request API endpoints
│   ├── auth.js           # Authentication endpoints
│   ├── documents.js      # Document management endpoints
│   ├── employes.js       # Employee management endpoints
│   ├── entites.js        # Entity management endpoints
│   ├── taches.js         # Task management endpoints
│   └── users.js          # User management endpoints
├── uploads/              # File upload storage
├── server.js             # Main server file
├── package.json          # Backend dependencies
└── README.md             # Backend documentation
```

## Authentication and Authorization
The system implements role-based access control with three main roles:
- **Employee**: Regular staff members who can view their own information and see their assigned tasks and submit demands
- **Manager**: Team leaders who can manage employees assigne tasks and approve/reject demands
- **Responsable RH**: HR personnel with access to organization-wide HR functions

## Attestation Request Workflow
1. Employee submits an attestation request
2. Manager reviews and approves/rejects the request
3. If approved by manager, HR reviews and approves/rejects
4. If approved by HR, the attestation can be generated

1. Employee submits a leave request with start and end dates
2. Manager reviews and approves/rejects the request
   - If rejected, the workflow ends
   - If approved, the request is sent to HR with an option to make it annulable or not
3. HR reviews and provides final approval/rejection
4. Employee can track the status of their request
5. If the request is annulable, employee can cancel it before it takes effect

## API Endpoints
The backend provides RESTful API endpoints for various operations:

### Attestation Endpoints
- `POST /attestations`: Create a new attestation request
- `GET /attestations/employee/:employeId`: Get attestations for an employee
- `GET /attestations/manager/:managerId`: Get attestations for manager validation
- `GET /attestations/hr`: Get attestations for HR validation
- `POST /attestations/:id/validate/manager`: Manager validation of an attestation
- `POST /attestations/:id/validate/hr`: HR validation of an attestation

### Leave Request (Congé) Endpoints
- `POST /api/conges`: Create a new leave request
- `GET /api/conges/employee/:employeId`: Get leave requests for an employee
- `GET /api/conges/manager/:managerId`: Get leave requests for manager validation
- `GET /api/conges/hr`: Get leave requests for HR validation
- `GET /api/conges/:id`: Get a specific leave request
- `POST /api/conges/:id/validate/manager`: Manager validation of a leave request
- `POST /api/conges/:id/validate/hr`: HR validation of a leave request
- `POST /api/conges/:id/cancel`: Cancel a leave request (if annulable)

### Authentication Endpoints
- `POST /auth/login`: User login
- `POST /auth/logout`: User logout

## Database Structure
The system uses a relational database with tables for:
- Users
- Employees
- Attestations
- Attestation validations
- Tasks
- Documents
- Entities

## Technologies Used
- **Frontend**: React, Ant Design, Axios
- **Backend**: Node.js, Express
- **Database**: MySQL 