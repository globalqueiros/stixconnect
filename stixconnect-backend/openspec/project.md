# Project Context

## Purpose
StixConnect is a comprehensive telemedicine backend API that manages medical consultations with Zoom integration. The system facilitates a complete patient journey: Patient → Nurse Triage → Doctor Consultation, with automated urgency classification and administrative reporting.

## Tech Stack
- **Backend Framework**: FastAPI 0.104.1
- **ASGI Server**: Uvicorn 0.24.0
- **Database**: SQLAlchemy 2.0.23 with SQLite (easily migratable to MariaDB)
- **Authentication**: JWT tokens with python-jose[cryptography]
- **Password Hashing**: PassLib with bcrypt
- **Data Validation**: Pydantic 2.5.0 and pydantic-settings
- **Environment Management**: python-dotenv
- **HTTP Client**: Requests 2.31.0
- **File Upload**: python-multipart

## Project Conventions

### Code Style
- **Language**: Python 3.x
- **Naming**: snake_case for variables and functions, PascalCase for classes
- **Database Models**: SQLAlchemy ORM with declarative base
- **API Schemas**: Pydantic models for request/response validation
- **Enums**: String-based enums for status, roles, and classifications
- **File Structure**: Modular structure with routers, services, models, schemas, and core modules

### Architecture Patterns
- **Framework**: FastAPI with dependency injection
- **Database**: SQLAlchemy ORM with relationship management
- **Authentication**: Role-based JWT authentication (Patient, Nurse, Doctor, Admin)
- **Service Layer**: Separation of business logic in service classes
- **Router Pattern**: Modular routers for different endpoints (auth, consultas, admin)
- **Configuration**: Centralized settings using pydantic-settings

### Testing Strategy
- No explicit testing framework detected in requirements
- Should implement pytest for unit and integration testing
- Focus on testing service layer business logic and API endpoints
- Database testing with SQLite in-memory for isolation

### Git Workflow
- No specific git configuration detected
- Recommend conventional commits with semantic versioning
- Feature branches for development, main for production

## Domain Context

### Medical Consultation Flow
1. **Patient Registration**: Users register with role-based access
2. **Consultation Request**: Patients request urgent or scheduled consultations
3. **Triage Process**: Nurses perform initial assessment with vital signs collection
4. **Urgency Classification**: Automatic algorithm + nurse validation (baixa, media, alta, critica)
5. **Doctor Assignment**: Based on urgency and availability
6. **Zoom Integration**: Automatic meeting creation and management
7. **Medical Consultation**: Video consultation with diagnosis and treatment
8. **Administrative Oversight**: Full reporting and statistics dashboard

### User Roles
- **Patient**: Can request consultations and view own medical history
- **Nurse**: Performs triage, manages patient queue, transfers to doctors
- **Doctor**: Conducts consultations, provides diagnoses, manages patient care
- **Admin**: Full system oversight, reports, user management, statistics

### Consultation Status Flow
aguardando → em_triagem → aguardando_medico → em_atendimento → finalizada
(Any status can transition to cancelada)

## Important Constraints

### Medical Data Compliance
- HIPAA-style data protection for medical information
- Secure handling of patient data (CPF, medical history)
- Audit trails for all medical consultations
- Data retention policies for medical records

### Performance Requirements
- Real-time Zoom meeting integration (sub-second response)
- Concurrent consultation handling for multiple patients
- Efficient triage classification algorithms
- Responsive admin dashboard with statistics

### Security Requirements
- JWT-based authentication with role-based access control
- Password hashing with bcrypt
- Secure Zoom API credential management
- CORS configuration for frontend integration
- Environment variable configuration for sensitive data

## External Dependencies

### Zoom API Integration
- **Account ID**: Required for OAuth 2.0 authentication
- **Client ID/Secret**: OAuth 2.0 credentials for meeting management
- **Features**: Meeting creation, participant management, recording options

### Database Considerations
- **Primary**: SQLite for development/easy deployment
- **Production**: MariaDB migration path for scalability
- **Relationships**: Complex many-to-many relationships between users and consultations
- **Indexes**: Optimized for email, CPF, and consultation status queries

### Environment Variables
- DATABASE_URL: Database connection string
- ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET: Zoom API credentials
- SECRET_KEY: JWT signing key
- ALGORITHM: JWT algorithm (HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES: Token lifetime (30 minutes)
- APP_NAME: Application identifier
- DEBUG: Development mode flag
