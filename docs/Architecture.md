# System Architecture

Frontend (React + Vite)
        │
 REST APIs
        │
Backend (FastAPI)
        │
 ├── Parsers
 ├── Security Engine
 ├── AI Engine
 └── SQLite Database

## Workflow

1. Upload configuration
2. Parse vendor syntax
3. Normalize data
4. Apply security rules
5. Generate findings
6. Calculate risk score
7. Display dashboard
