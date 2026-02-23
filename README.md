# Security Scanner Extension

A full-stack web security vulnerability scanner — C# .NET 8 backend API paired with a React frontend.

---

## Project Structure

```
/backend
  /Application     – DTOs, interfaces, services, validators
  /Core            – Domain entities and interfaces
  /Infrastructure  – EF Core DbContext, migrations, repositories
  /WebAPI          – ASP.NET Core controllers, middleware, entry point
  SecurityScanner.sln

/frontend          – React/Vite web application (Chrome Extension UI)
  /src
    /api           – Axios API client
    /components    – Reusable components (Navbar, Footer, …)
    /pages         – Page components (Home, Login, Register, Bugs, …)
  index.html
  package.json
  vite.config.js

/database
  /scripts
    InitialSchema.sql  – SQL script to create all tables manually

README.md
```

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0 |
| [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) | 2019+ (Express is fine) |
| [Node.js](https://nodejs.org/) | 18+ |
| [npm](https://www.npmjs.com/) | 9+ |

---

## 1. Database Setup

### Option A – Using the SQL Script (recommended for first-time setup)

1. Open **SQL Server Management Studio (SSMS)** or **Azure Data Studio**.
2. Connect to your local SQL Server instance.
3. Open the file `database/scripts/InitialSchema.sql`.
4. Execute the script. It will:
   - Create the `SecurityScanner` database (if it does not exist).
   - Create the tables: `Users`, `Scans`, `Vulnerabilities`, `Reports`.
   - Create all required indexes.
   - Insert migration history so EF Core won't re-run the migrations.

### Option B – Using Entity Framework Core Migrations

```bash
cd backend

# Apply all pending migrations to create the database and tables
dotnet ef database update --project Infrastructure --startup-project WebAPI
```

> If `dotnet-ef` is not installed globally:
> ```bash
> dotnet tool install --global dotnet-ef
> ```

---

## 2. Backend Setup

### Connection String

The backend connects to SQL Server using Windows Authentication (Trusted Connection).  
The default connection string in `backend/WebAPI/appsettings.json` is:

```json
"DefaultConnection": "Server=(local);Database=SecurityScanner;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

If your SQL Server instance name is different (e.g., `.\SQLEXPRESS`), update `appsettings.json`:

```json
"DefaultConnection": "Server=.\\SQLEXPRESS;Database=SecurityScanner;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

### Run the Backend

```bash
cd backend/WebAPI
dotnet run
```

The API will start on **http://localhost:5000** (HTTP) and **https://localhost:5001** (HTTPS).

Swagger UI is available at: **http://localhost:5000/swagger**

---

## 3. Frontend Setup

### Configure API URL

The frontend reads the backend URL from an environment variable.  
Create (or verify) the file `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

A sample file `frontend/.env.example` is provided.

### Install Dependencies

```bash
cd frontend
npm install
```

### Run the Frontend

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## 4. Running Both Servers

Open **two terminal windows**:

**Terminal 1 – Backend:**
```bash
cd backend/WebAPI
dotnet run
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser at `http://localhost:5173`.

---

## 5. API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/scans` | List all scans for current user | Yes |
| POST | `/api/scans` | Create a new scan | Yes |
| GET | `/api/scans/{id}` | Get scan details | Yes |
| GET | `/api/vulnerabilities/scan/{scanId}` | List vulnerabilities for a scan | Yes |
| GET | `/api/reports/{scanId}` | Get report for a scan | Yes |

All protected endpoints require the header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 6. CORS Configuration

The backend allows requests from:
- `http://localhost:3000`
- `http://localhost:5173` (Vite dev server)
- `chrome-extension://*` (Chrome Extension)

To add other origins, edit `backend/WebAPI/appsettings.json`:

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:3000",
    "http://localhost:5173",
    "chrome-extension://*"
  ]
}
```

---

## 7. Troubleshooting

### `Invalid object name 'Users'`
The database tables have not been created yet. Run the SQL script or EF Core migrations (see **Section 1** above).

### `A network-related or instance-specific error occurred`
SQL Server is not running or the connection string is wrong. Check:
1. SQL Server service is running in **Services** or **SQL Server Configuration Manager**.
2. The `Server=` value in `appsettings.json` matches your instance name.
   - Default instance: `Server=(local)` or `Server=.`
   - Named instance: `Server=.\SQLEXPRESS` or `Server=localhost\SQLEXPRESS`

### Frontend cannot reach the backend
- Make sure the backend is running on port 5000.
- Check that `frontend/.env` contains `VITE_API_URL=http://localhost:5000/api`.
- Restart the frontend dev server after changing `.env`.

### JWT / Authentication errors
The JWT secret key is set in `appsettings.json`. Make sure both `appsettings.json` and `appsettings.Development.json` use the same key in production.
