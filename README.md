# 🛡 AI Network Security Auditor

**Smart India Hackathon 2026 — SIH26155**

An AI-powered network configuration auditing platform that analyzes Cisco, Fortinet, and Palo Alto firewall/router configurations to detect vulnerabilities, calculate security risk, visualize attack paths, and generate remediation suggestions.

## Features

- Cisco, Fortinet & Palo Alto Parser
- AI Anomaly Detection
- Security Risk Scoring
- Attack Path Visualization
- Interactive Dashboard
- AI Remediation Suggestions
- Topology Graph
- Security Heat Map

## Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React + Vite |
| Backend | FastAPI |
| AI | Python |
| Database | SQLite |
| Visualization | React Flow + Recharts |

## Run Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Backend:

<http://127.0.0.1:8000>

Frontend:

<http://localhost:5173>
