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

/frontend          – React/Vite web application
  /src
    /api           – Axios API client (authApi, scansApi)
    /components    – Reusable components (LandingNavbar, Navbar, Footer, …)
    /pages         – Page components (Home, Login, Register, Bugs, Profile, …)
  index.html
  package.json
  vite.config.js
  /extension       – Chrome Extension (Manifest V3)
    manifest.json
    /popup         – Extension popup UI
    /background    – Service worker
    /content       – Content script
    /scanners      – 20 passive vulnerability scanners
    /icons         – Extension icons

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

---

## Chrome Extension

The Baseera Security Scanner Chrome Extension allows passive vulnerability scanning of any web page and syncs results with your Baseera account.

### Extension Location

```
frontend/extension/
├── manifest.json          – Manifest V3 configuration
├── popup/
│   ├── popup.html         – Extension UI
│   ├── popup.css          – Styling (matches Baseera design)
│   └── popup.js           – Scan logic and UI interactions
├── background/
│   └── background.js      – Service worker (handles auth token storage)
├── content/
│   └── content.js         – Content script (passive observer)
├── scanners/
│   ├── index.js           – Scanner registry
│   ├── xss.js             – XSS detection
│   ├── sql-injection.js   – SQL error detection
│   ├── command-injection.js – Command error detection
│   ├── api-keys.js        – Exposed API keys
│   ├── insecure-forms.js  – Password forms over HTTP
│   ├── csp.js             – Missing Content-Security-Policy
│   ├── sensitive-files.js – Exposed sensitive paths
│   ├── mixed-content.js   – HTTP resources on HTTPS pages
│   ├── hsts.js            – Missing HSTS header
│   ├── clickjacking.js    – Missing X-Frame-Options
│   ├── cookies.js         – Insecure cookies (no HttpOnly)
│   ├── sri.js             – Missing Subresource Integrity
│   ├── cors.js            – Wildcard CORS policy
│   ├── debug-pages.js     – Exposed debug endpoints
│   ├── open-redirect.js   – Unvalidated redirects
│   ├── csrf.js            – Forms without CSRF tokens
│   ├── deprecated-html.js – Deprecated HTML tags
│   └── trackers.js        – Excessive analytics trackers
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Installing the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `frontend/extension/` directory
5. The Baseera Security Scanner icon will appear in your Chrome toolbar

### Using the Extension

1. Navigate to any website you want to scan
2. Click the **Baseera** icon in the Chrome toolbar
3. Click **Scan Page** to run passive vulnerability detection
4. Review the results:
   - **Risk Score** (0–100) indicates overall page risk
   - Vulnerabilities are grouped by severity: Critical, High, Medium, Low
5. If you are logged in, click **Save to Account** to store results in your Baseera account

### Linking the Extension with Your Account

The extension stores your JWT token in Chrome's local storage after you log in via the Baseera web app. To link:

1. Open the Baseera web app (`http://localhost:5173`) and log in
2. The extension automatically detects the auth token (stored in `localStorage`)
3. Scan results submitted via **Save to Account** appear in your **Bugs** dashboard under the Vulnerabilities tab

> **Note:** The extension performs **passive scanning only** — it reads page content and DOM without modifying anything or making requests on your behalf.

