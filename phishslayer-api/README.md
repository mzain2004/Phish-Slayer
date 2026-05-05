# FILE: phishslayer-api/README.md

# PhishSlayer Python FastAPI Backend

This is the Python FastAPI backend for the PhishSlayer SOC platform. It provides REST APIs for alert management, threat hunting, case management, and more.

## Architecture

```
phishslayer-api/
├── main.py              # FastAPI app entry point
├── requirements.txt     # Python dependencies
├── .env.example         # Example environment variables
├── models/              # Pydantic v2 models for request/response validation
│   ├── common.py        # Shared models (PaginatedResponse, ErrorResponse, etc)
│   ├── alerts.py        # Alert models
│   ├── cases.py         # Case models
│   ├── connectors.py    # Connector models
│   ├── detection.py     # Detection rule models
│   ├── intel.py         # Threat intelligence models
│   ├── metrics.py       # Metrics models
│   ├── osint.py         # OSINT models
│   ├── playbooks.py     # Playbook models
│   ├── sigma.py         # Sigma rule models
│   ├── assets.py        # Asset models
│   ├── hunting.py       # Threat hunting models
│   ├── mitre.py         # MITRE ATT&CK models
│   └── ingest.py        # Data ingestion models
├── routers/             # FastAPI routers for each domain
│   ├── alerts.py        # /api/alerts/* routes
│   ├── cases.py         # /api/cases/* routes
│   ├── connectors.py    # /api/connectors/* routes
│   ├── detection.py     # /api/detection-rules/* routes
│   ├── hunting.py       # /api/hunting/* routes
│   ├── intel.py         # /api/tip/* routes
│   ├── metrics.py       # /api/metrics/* routes
│   ├── osint.py         # /api/osint/* routes
│   ├── playbooks.py     # /api/playbooks/* routes
│   ├── sigma.py         # /api/sigma/* routes
│   ├── settings.py      # /api/settings/* routes
│   ├── assets.py        # /api/assets/* routes
│   ├── ingest.py        # /api/ingest/* routes
│   ├── mitre.py         # /api/mitre/* routes
│   ├── cron.py          # /api/cron/* routes
│   ├── users.py         # /api/users/* and /api/organizations/* routes
│   ├── wazuh.py         # /api/wazuh/* routes
│   ├── incidents.py     # /api/incidents/* routes
│   ├── health.py        # /api/health/* routes (pre-existing)
│   └── soc.py           # /api/soc/* routes (pre-existing)
├── agents/              # Agent implementations (pre-existing)
│   ├── l1_triage.py
│   ├── l2_investigator.py
│   └── l3_hunt.py
├── harness/             # Execution harness (pre-existing)
└── venv/                # Python virtual environment
```

## Setup

### 1. Create Virtual Environment

```bash
cd phishslayer-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual configuration
```

### 4. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

Once running, visit:

- **Interactive docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative docs**: http://localhost:8000/redoc (ReDoc)

## Design Principles

### Request/Response Models

- All request bodies use Pydantic v2 models with `ConfigDict(extra="ignore")`
- All responses are typed Pydantic models
- Shared models in `models/common.py`

### Router Structure

- One router file per domain
- Router files should not exceed 100 lines (split if needed)
- Each route has `Cache-Control: no-store` header
- All routes wrapped in try/except returning HTTP 500 on failure

### Type Hints

- Type hints on every function parameter and return value
- Use `Optional[]`, `List[]`, `Dict[]` from typing module
- All Pydantic models use type hints

### No Business Logic Yet

- All endpoints are stubs returning mock data
- Business logic migration from Next.js app/api/\* to be implemented
- Look for `# TODO: implement` comments

### Authentication

- Stub implementation - add proper auth middleware before production
- Note `# TODO: implement authentication` in relevant routers

## Migrating Business Logic

Each router file has migration comments indicating which Next.js routes it corresponds to:

```python
# FILE: routers/alerts.py
# Migrated from: app/api/alerts/route.ts
# TODO: implement business logic
```

To implement business logic:

1. Read the Next.js route file
2. Understand the request/response shape
3. Implement the logic in the corresponding Python router function
4. Update the Pydantic models as needed

## Database

The backend integrates with:

- **MongoDB** for document storage (via motor async driver)
- **Supabase** for user authentication and real-time features

See `.env.example` for configuration.

## Integration with Next.js Frontend

The Next.js frontend proxies requests to this Python backend via these routes:

- `app/api/soc/l1/route.ts` → `POST /api/soc/l1`
- `app/api/soc/pipeline/route.ts` → `POST /api/soc/pipeline`

The frontend expects `PYTHON_API_URL` environment variable (defaults to `http://localhost:8000`).

## Testing

Run tests:

```bash
pytest
```

Run specific test file:

```bash
pytest tests/test_alerts.py
```

With coverage:

```bash
pytest --cov=routers --cov=models
```

## Development Workflow

1. **Add a new route**: Create endpoint in appropriate router file
2. **Add Pydantic model**: Define request/response in corresponding models file
3. **Test locally**: Use Swagger UI at `/docs`
4. **Implement logic**: Replace mock data with real implementation
5. **Run tests**: Ensure all tests pass

## Common Issues

### ModuleNotFoundError: No module named 'models'

Solution: Run from the `phishslayer-api` directory where `main.py` exists

### PYTHON_API_URL not found

Solution: Ensure `.env` file exists and has `PYTHON_API_URL=http://localhost:8000`

### Port 8000 already in use

Solution: Use different port: `uvicorn main:app --port 8001`

## Status

✅ **Stubs created** for all major routes  
⏳ **Business logic implementation** pending  
⏳ **Database integration** pending  
⏳ **Authentication middleware** pending  
⏳ **Tests** pending

## Contact

For questions or issues, please refer to the main PhishSlayer repository.
