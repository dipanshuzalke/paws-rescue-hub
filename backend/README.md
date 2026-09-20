# ResQ Paws — Stray Animal Rescue Coordination & Management System

ResQ Paws is an Express and MongoDB-based API designed to coordinate stray animal rescues between citizens, rescuers, and NGOs. It provides rescue reporting, manual NGO-controlled rescuer assignment, status lifecycle tracking, notifications and analytics.

## Requirements

- **Node.js**: 20.x or higher
- **MongoDB**: 6.0+ (Local or Atlas)
- **Cloudinary**: For animal and rescue-proof image storage

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your credentials.
   

## Setup

### MongoDB
Ensure MongoDB is running locally or provide a URI to a remote instance. The system uses Mongoose for ODM.

### Cloudinary
Sign up at [Cloudinary](https://cloudinary.com/) and obtain your API credentials to enable image uploads for rescue reports and proof.

```

### Password-reset email

Password reset links are sent through SMTP using the configured mail provider.
Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and
`SMTP_FROM` in your environment. Also set `CLIENT_URL` to the public frontend URL
so reset links open the correct page.

This is the recommended production setup because many hosts block outbound SMTP
ports unless you use a provider with explicit credentials and verified sender setup.
Do not commit credentials to `.env` files tracked by Git.

## Database Seeding

The project includes a comprehensive seeding script to populate the database with demo data (Nagpur area).

- **Standard seed**: `npm run seed` (Appends to existing data)
- **Fresh seed**: `npm run seed:fresh` (Wipes all relevant collections before seeding)

### Demo Credentials
*Note: All passwords are `demo1234` (or whatever is set in `SEED_PASSWORD`).*

- **Admin**: `admin@demo.com`
- **NGO Coordinator**: `ngo@demo.com`
- **Rescuer**: `rescuer@demo.com`
- **Citizen**: `citizen@demo.com`

## Architecture Overview

- `src/app.js`: Express application setup and middleware.
- `src/server.js`: Database connection and server bootstrap.
- `src/models/`: Mongoose schemas (User, RescueReport, Organization, etc.).
- `src/controllers/`: Business logic for API endpoints.
- `src/routes/`: Route definitions grouped by resource.
- `src/middleware/`: Authentication, authorization, and error handling.
- `src/services/`: Shared business logic and database queries.
- `src/utils/`: Constants, validators, and helper functions.

## API Documentation

For a full reference of available endpoints, request bodies, and roles, see [API.md](./API.md).
