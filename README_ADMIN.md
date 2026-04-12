# RoadGuard Admin Dashboard

A comprehensive admin dashboard for managing road hazard reports in the RoadGuard system.

## Features

### Authentication
- JWT-based admin authentication
- Secure login system

### Dashboard Overview
- Real-time statistics (total reports, resolved, pending, in progress)
- Daily and weekly report trends
- Status distribution charts
- Most affected areas heatmap

### Complaint Management
- View all complaints with filtering
- Update complaint status (Pending → In Progress → Resolved/Rejected)
- Priority-based sorting (auto-calculated based on location density)
- Detailed complaint view with images and location

### Interactive Map
- Leaflet-based map with complaint markers
- Color-coded markers by status
- Popup details with images and information
- Click to view full complaint details

### Analytics
- Comprehensive analytics dashboard
- Report trends and patterns
- Area-wise hazard distribution

### Activity Logging
- Track all admin actions
- Complaint status changes history

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB with geospatial support
- **Maps**: Leaflet with OpenStreetMap
- **Charts**: Recharts
- **Authentication**: JWT

## Setup Instructions

### Backend Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Set up MongoDB:
- Install MongoDB locally or use MongoDB Atlas
- Update `MONGODB_URL` in `database.py` if needed

3. Run the seed script to create admin user and sample data:
```bash
python seed.py
```

4. Start the backend server:
```bash
python main.py
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend/admin
npm install
```

2. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/register` - Register new admin (for setup)

### Complaints
- `GET /api/admin/complaints` - Get all complaints with filtering
- `GET /api/admin/complaints/{id}` - Get specific complaint
- `PUT /api/admin/complaints/{id}/status` - Update complaint status

### Analytics
- `GET /api/admin/analytics` - Get dashboard analytics
- `GET /api/admin/activity` - Get activity logs

## Auto-Priority System

Complaints are automatically assigned priority based on location density:
- **High**: 5+ complaints within 1km radius in last 30 days
- **Medium**: 2-4 complaints in same area
- **Low**: 1 complaint or sparse area

## Default Admin Credentials

- Email: `admin@roadguard.in`
- Password: `roadguard@admin2024`

## Production Deployment

1. Set environment variables:
   - `MONGODB_URL`: MongoDB connection string
   - `SECRET_KEY`: JWT secret key

2. Use a production WSGI server (e.g., Gunicorn) for FastAPI

3. Configure CORS properly for your domain

4. Set up proper logging and monitoring

## File Structure

```
backend/
├── main.py              # FastAPI application
├── models.py            # Pydantic models
├── database.py          # MongoDB operations
├── auth.py              # Authentication utilities
├── routes.py            # Admin API routes
├── seed.py              # Data seeding script
└── requirements.txt     # Python dependencies

frontend/admin/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── context/
│   │   └── AdminContext.jsx
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── TopNav.jsx
│   │   └── Toast.jsx
│   ├── pages/
│   │   ├── Overview.jsx
│   │   ├── Reports.jsx
│   │   ├── HazardMap.jsx
│   │   └── LoginPage.jsx
│   └── styles/
│       ├── globals.css
│       └── theme.css
├── package.json
└── tailwind.config.js
```