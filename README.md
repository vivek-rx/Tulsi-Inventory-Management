<<<<<<< HEAD
# Tulsi-Inventory-Management
=======
# Wire Manufacturing Production Monitoring System

A comprehensive, real-time production monitoring dashboard for wire manufacturing operations. Built for Tulsi Industries to track, analyze, and optimize the sequential production process from raw material to finished product.

## 🏭 Production Process

The system monitors a **sequential 5-stage production line**:

```
RBD → Inter → Oven → DPC → Rewind
```

### Stage Details

1. **RBD (Rough Drawing)**
   - Initial wire drawing process
   - Output: 3.0 mm diameter wire
   - First stage in the production line

2. **Inter (Intermediate Drawing)**
   - **Without annealing**
   - Converts 3.0 mm → 1.0 mm
   - Critical size reduction stage

3. **Oven (Annealing)**
   - **With annealing process**
   - Heat treatment for wire softening
   - Input: 1.0 mm wire

4. **DPC (Drawing, Patenting, Coating)**
   - Further processing and coating
   - Prepares wire for final stage

5. **Rewind (Final Stage)**
   - Final winding and packaging
   - Output represents total production

### Process Characteristics

- **Sequential dependency**: Each stage depends on the output of the previous stage
- **Material flow**: Production loss or delay at any stage affects downstream stages
- **Quality tracking**: Efficiency and scrap monitored at each stage
- **WIP monitoring**: Work-in-progress tracked between stages

---

## 🎯 Key Performance Indicators (KPIs)

### 1. Stage-wise Efficiency
```
Efficiency (%) = (Output Qty / Input Qty) × 100
```
- **Good**: ≥ 90%
- **Warning**: 80-90%
- **Critical**: < 80%

### 2. Loss Percentage
```
Loss (%) = (Scrap Qty / Input Qty) × 100
```
- Tracks material wastage at each stage
- Alerts triggered when above threshold

### 3. Overall Efficiency
```
Overall Efficiency = (Final Output / Initial Input) × 100
```
- End-to-end production efficiency
- RBD input to Rewind output

### 4. Bottleneck Detection
- Identifies the stage with lowest efficiency
- Highlights production constraints
- Enables targeted improvements

### 5. Work-in-Progress (WIP)
```
WIP = Output of Stage N - Input of Stage N+1
```
- Tracks material queued between stages
- Identifies process imbalances

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: SQLite (upgradeable to PostgreSQL)
- **Data Processing**: Pandas
- **ORM**: SQLAlchemy
- **Validation**: Pydantic

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: React Query
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (for frontend)
- **API Server**: Uvicorn (ASGI)

---

## 📁 Project Structure

```
Tulsi-Inventory-Mmt/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── database.py             # Database configuration
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── analytics.py            # KPI calculation engine
│   ├── data_loader.py          # Excel data loader & sample generator
│   ├── config.py               # Application settings
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile             # Backend container
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ProcessFlow.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   ├── ProductionCharts.tsx
│   │   │   ├── ProductionTable.tsx
│   │   │   └── DateFilter.tsx
│   │   ├── App.tsx            # Main application
│   │   ├── main.tsx           # Entry point
│   │   ├── api.ts             # API client
│   │   ├── types.ts           # TypeScript definitions
│   │   └── index.css          # Styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── nginx.conf             # Nginx configuration
│   └── Dockerfile             # Frontend container
│
├── docker-compose.yml          # Multi-container setup
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **OR** Python 3.11+ and Node.js 18+ for local development

### Option 1: Docker (Recommended)

```bash
# Navigate to project directory
cd Tulsi-Inventory-Mmt

# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

The system will automatically:
1. Initialize the database
2. Load sample production data (30 days)
3. Start both frontend and backend services

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database with sample data
python data_loader.py

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at http://localhost:8000

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at http://localhost:5173

---

## 📊 Dashboard Features

### 1. Summary Cards
- **Total Production**: Final output from Rewind stage
- **Overall Efficiency**: End-to-end efficiency percentage
- **Total Scrap**: Cumulative material loss
- **Active Alerts**: Count of warnings and critical issues

### 2. Process Flow Visualization
- Horizontal pipeline showing all 5 stages
- Real-time status indicators (Green/Yellow/Red)
- Input/Output quantities for each stage
- Efficiency percentage display
- Wire size specifications

### 3. Production Charts
- **Bar Chart**: Stage-wise output and scrap comparison
- **Line Chart**: Daily production trend by stage
- Interactive tooltips and legends

### 4. Alerts Panel
- **Critical Alerts**: Efficiency < 80% or Loss > 5%
- **Warnings**: Efficiency 80-90% or Loss 3-5%
- **Bottleneck Alerts**: Lowest performing stage
- Real-time monitoring with auto-refresh

### 5. Production Records Table
- Detailed production logs
- Sortable and filterable
- Efficiency color coding
- Recent 20 records display

### 6. Date Range Filters
- Custom date selection
- Quick presets: 7, 30, 90 days
- Applies to all dashboard components

---

## 🔌 API Endpoints

### Summary & Analytics
- `GET /api/summary` - Dashboard summary with KPIs
- `GET /api/process-flow` - Complete production flow
- `GET /api/stats/summary` - Comprehensive statistics

### Stage Operations
- `GET /api/stage/{stage_name}` - Detailed stage information
- `GET /api/stages/config` - Stage configurations

### Data Retrieval
- `GET /api/records` - Production records (with filters)
- `GET /api/timeline` - Timeline data for charts
- `POST /api/records` - Create new production record

### Monitoring
- `GET /api/alerts` - Production alerts
- `GET /api/wip` - Work-in-progress analysis

**Query Parameters** (all endpoints):
- `start_date`: Filter start date (YYYY-MM-DD)
- `end_date`: Filter end date (YYYY-MM-DD)
- `stage`: Filter by production stage
- `shift`: Filter by shift (Morning/Afternoon/Night)

**API Documentation**: http://localhost:8000/docs

---

## 📥 Data Import

### From Excel File

The system can import data from `TULSI PI PRODUCTION REPORT.xlsx`:

```python
from data_loader import DataLoader
from database import SessionLocal

db = SessionLocal()
loader = DataLoader(db)

# Load Excel file
loader.load_from_excel("path/to/TULSI PI PRODUCTION REPORT.xlsx")
```

**Expected Excel Columns**:
- Date
- Shift
- Machine/Stage
- Input Qty
- Output Qty
- Scrap/Loss
- Size (mm) or Size (SWG)

The loader automatically:
- Normalizes stage and shift names
- Calculates efficiency and loss percentages
- Handles missing data gracefully

### Sample Data Generation

For testing, the system includes a sample data generator:

```bash
cd backend
python data_loader.py
```

Generates 30 days of realistic production data across all stages and shifts.

---

## 🎨 Customization

### Efficiency Thresholds

Edit `backend/config.py`:

```python
efficiency_warning_threshold: float = 90.0
efficiency_critical_threshold: float = 80.0
loss_warning_threshold: float = 3.0
loss_critical_threshold: float = 5.0
```

### Stage Configuration

Modify stage parameters in database or via API:

```python
# Example: Update minimum efficiency for RBD stage
stage_config.min_efficiency = 92.0
stage_config.max_loss_percentage = 3.0
```

### UI Styling

Edit `frontend/tailwind.config.js` for color schemes and themes.

---

## 🔒 Production Deployment

### Environment Variables

Create `.env` files for production:

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
CORS_ORIGINS=["https://yourdomain.com"]
```

**Frontend** (`frontend/.env.production`):
```env
VITE_API_URL=https://api.yourdomain.com
```

### Docker Production Build

```bash
# Build optimized production images
docker-compose -f docker-compose.yml up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Database Migration

For PostgreSQL in production:

1. Update `DATABASE_URL` in backend config
2. Run migrations:
```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 📈 Performance Optimization

### Backend
- Database indexing on `date`, `stage`, `shift` columns
- API response caching
- Pagination for large datasets
- Query optimization with SQLAlchemy

### Frontend
- React Query for smart caching
- Auto-refresh intervals (30-60 seconds)
- Lazy loading for heavy components
- Production build minification

---

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset database
cd backend
rm production_monitoring.db
python data_loader.py
```

### Port Conflicts
Edit `docker-compose.yml` to change ports:
```yaml
ports:
  - "8080:8000"  # Backend
  - "3000:80"    # Frontend
```

### CORS Errors
Update `backend/config.py`:
```python
cors_origins: list = ["http://localhost:3000", "https://yourdomain.com"]
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is proprietary software developed for Tulsi Industries.

---

## 📞 Support

For technical support or questions:
- Email: support@tulsi.com
- Documentation: http://localhost:8000/docs
- Issue Tracker: GitHub Issues

---

## 🎯 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Machine learning for predictive maintenance
- [ ] Mobile app (React Native)
- [ ] Advanced reporting (PDF export)
- [ ] Multi-factory support
- [ ] User authentication and roles
- [ ] Production planning module
- [ ] Maintenance scheduling
- [ ] Quality control integration
- [ ] Inventory management

---

**Built with ❤️ for Tulsi Wire Manufacturing**
>>>>>>> 7fce05f (project added)
