# BrightCoach Backend API Documentation

## Base URL

- `http://localhost:5000/api`

## Authentication

### POST /auth/login

- Description: Authenticate an existing user and return a JWT token.
- Body:
  ```json
  {
    "email": "admin@example.com",
    "password": "your_password"
  }
  ```
- Response:
  ```json
  {
    "token": "<jwt_token>",
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin",
      "center_id": 1
    }
  }
  ```

### POST /auth/register

- Description: Register a new admin user and coaching center.
- Body:
  ```json
  {
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "securePassword123",
    "centerName": "Bright Coaching",
    "city": "Bhubaneswar"
  }
  ```
- Response: newly created user record.

## Authorization

- All endpoints except `/auth/login` and `/auth/register` require an `Authorization` header.
- Header:
  ```http
  Authorization: Bearer <jwt_token>
  ```

## Students

### GET /students

- Description: Fetch all students for the authenticated center.
- Response: list of student objects.

### POST /students

- Description: Create a new student.
- Body:
  ```json
  {
    "name": "Rohan Das",
    "class": "10"
  }
  ```

## Fees

### GET /fees/structures

- Description: Fetch class-wise fee structures for the authenticated center.
- Optional query params:
  - `academic_year` (example: `2026-2027`)

### POST /fees/structures

- Description: Create or update a class fee structure.
- Body:
  ```json
  {
    "class": "Class X",
    "academic_year": "2026-2027",
    "yearly_amount": 60000,
    "description": "Board batch yearly fee"
  }
  ```
- Response includes computed `monthly_amount`, `quarterly_amount`, and `half_yearly_amount`.

### GET /fees

- Description: Fetch fee installment records for the authenticated center.
- Optional query params:
  - `status` (`pending`, `partial`, `paid`)
  - `student_id`
  - `billing_cycle` (`monthly`, `quarterly`, `half_yearly`, `yearly`)

### POST /fees

- Description: Create a student fee plan and auto-generate installments.
- Body:
  ```json
  {
    "student_id": 12,
    "billing_cycle": "monthly",
    "academic_year": "2026-2027",
    "plan_start_date": "2026-04-01",
    "due_day": 5,
    "include_transport": true,
    "include_hostel": false,
    "notes": "Monthly plan for session"
  }
  ```

### GET /fees/student/:id/plan

- Description: Fetch the active fee plan for one student.

### POST /fees/student/:id/plan

- Description: Create a fee plan for a specific student.

### PATCH /fees/:id/pay

- Description: Pay a specific installment. Partial payment is supported.
- Body:
  ```json
  {
    "amount": 1500,
    "payment_date": "2026-03-20",
    "payment_mode": "upi",
    "transaction_id": "TXN123",
    "notes": "Part payment"
  }
  ```

### POST /fees/students/:id/pay

- Description: Apply one payment to the student's oldest pending installments automatically.
- Body:
  ```json
  {
    "amount": 7000,
    "payment_date": "2026-03-20",
    "payment_mode": "cash",
    "notes": "Collected at office"
  }
  ```

### GET /fees/summary

- Description: Get fee summary totals for the authenticated center.
- Response sample:
  ```json
  {
    "total_billed": 100000,
    "total_collected": 80000,
    "total_pending": 20000,
    "paid_count": 40,
    "pending_count": 10,
    "partial_count": 5
  }
  ```

## Dashboard

### GET /dashboard

- Description: Retrieve aggregated dashboard stats for the authenticated center.
- Response fields:
  - `students`
  - `fees`
  - `hostel`
  - `transport`
  - `notices`

## Exams

### GET /exams

- Description: Fetch exam definitions for the authenticated center.

### POST /exams

- Description: Create a new exam.
- Body:
  ```json
  {
    "subject": "Math",
    "class": "10",
    "exam_date": "2026-04-05",
    "time": "10:00",
    "duration": 120,
    "max_marks": 100,
    "examiner": "Mr. Das"
  }
  ```

### POST /exams/:id/results

- Description: Add or update exam results for a student.
- Body:
  ```json
  {
    "student_id": 22,
    "marks_obtained": 88,
    "grade": "A",
    "remarks": "Excellent"
  }
  ```

### GET /exams/:id/results

- Description: Fetch all results for a specific exam.

## Transport

### GET /transport/routes

- Description: Fetch all transport routes.

### POST /transport/routes

- Description: Create a new transport route.
- Body:
  ```json
  {
    "route_name": "North Route",
    "vehicle_number": "OR05AB1234",
    "driver_name": "Suresh Kumar",
    "driver_phone": "9876543210",
    "monthly_fee": 1500,
    "capacity": 30
  }
  ```

### POST /transport/assign

- Description: Assign a student to a transport route.
- Body:
  ```json
  {
    "student_id": 12,
    "route_id": 5
  }
  ```

## Hostel

### GET /hostel/rooms

- Description: Fetch all hostel rooms and occupant details.

### POST /hostel/rooms

- Description: Create a new hostel room.
- Body:
  ```json
  {
    "room_number": "101",
    "floor": "1",
    "type": "single",
    "capacity": 2,
    "monthly_fee": 4000
  }
  ```

### POST /hostel/assign

- Description: Assign a student to a hostel room.
- Body:
  ```json
  {
    "student_id": 12,
    "room_id": 3
  }
  ```

## Notices

### GET /notices

- Description: Fetch all notices.

### POST /notices

- Description: Create a new notice.
- Body:
  ```json
  {
    "title": "Exam Schedule",
    "content": "Final exams start on April 5th.",
    "target_audience": "all",
    "priority": "high",
    "expires_at": "2026-04-30"
  }
  ```

### DELETE /notices/:id

- Description: Delete a notice by ID.

## Parents

### GET /parents

- Description: Fetch all parents and their associated children.

## Environment

Required backend environment variables:

- `JWT_SECRET`
- `DB_USER`
- `DB_HOST`
- `DB_NAME`
- `DB_PASSWORD`
- `DB_PORT`
- `PORT` (optional, defaults to `5000`)

## Notes

- All data endpoints are scoped to the authenticated user's `center_id`.
- The JWT token returned by `/auth/login` must be sent in the `Authorization` header for protected endpoints.
