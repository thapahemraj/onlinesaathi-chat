# OnlineSaathi Chat

## Project
- **Name**: OnlineSaathi Chat
- **Description**: A real-time chat application consisting of an Angular frontend and a .NET Web API backend (SignalR + REST). This repository contains two main projects:
  - `Online-Sathi-Chat` (Angular frontend)
  - `OnlineSaathi.API` (ASP.NET Core Web API + SignalR)

## Features
- User authentication (JWT)
- Real-time messaging via SignalR
- REST endpoints for user and chat management
- Basic UI for login and chat using Angular

## Repository structure (relevant folders)
- `OnlineSaathi.API/` - .NET backend (API, Hubs, Services, Models)
- `Online-Sathi-Chat/` - Angular frontend (src, app, assets)

## Prerequisites
- Node.js (16+ recommended) and `npm`
- Angular CLI (if you want to use `ng` commands globally): `npm i -g @angular/cli`
- .NET SDK 8.0
- MongoDB running (local or cloud) or change connection string in the backend config

## Setup & Run (Development)
1. Backend (.NET API)

- Edit backend configuration (optional): update `appsettings.json` or `appsettings.Development.json` in `OnlineSaathi.API/` for MongoDB and `JwtSettings:SecretKey`.

- Restore and run the API:

```bash
cd OnlineSaathi.API
# restore packages and run
dotnet restore
dotnet run
```

The API will listen on the address shown in the console (commonly `http://localhost:5025`).

2. Frontend (Angular)

- Install dependencies and run the Angular dev server:

```bash
cd Online-Sathi-Chat
npm install
npm start
```

The frontend dev server runs by default at `http://localhost:4200/`.

## Environment / Configuration
- Backend JWT secret: set in `OnlineSaathi.API/appsettings.json` under `JwtSettings:SecretKey`.
- MongoDB connection: set in `OnlineSaathi.API/appsettings.json` under `MongoDB:ConnectionString` and `MongoDB:DatabaseName`.
- CORS: The API uses a CORS policy that permits `http://localhost:3000` by default — update this in `Program.cs` if your frontend runs on a different origin (e.g., `http://localhost:4200`).

## Ports
- Frontend (Angular): `http://localhost:4200/`
- Backend API: `http://localhost:5025/`
- SignalR Hub endpoint: `http://localhost:5025/chatHub`

## Troubleshooting
- Port already in use: stop the process using the port (example):

```bash
# find and kill process on port 5025
lsof -i :5025
lsof -i :5025 | awk '{print $2}' | xargs -r kill -9
```

- .NET SDK mismatch: ensure you have .NET 8.0 installed (project targets `net8.0`). If packages require net9.0, downgrade package versions or install .NET 9 SDK.
- Angular template errors about `NgIf`/`CommonModule`: components may be standalone or module-based — ensure `CommonModule` (or `NgIf`) is imported in `@Component.imports` or included via module imports.
- Swagger duplicate key error (`An item with the same key has already been added. Key: v1`): remove duplicate `AddSwaggerGen`/`SwaggerDoc` calls in `Program.cs`.
- DataProtection warning about key storage: this is informational in container/dev environments — consider configuring a persistent key storage for production.

## Next steps / Notes
- Update `appsettings` with production-safe values before deploying.
- Consider persisting Data Protection keys and enabling HTTPS for production.

## Author
- Created by: https://thapahemraj.com.np

---
If you want, I can also add a short CONTRIBUTING or setup script. Tell me what else you'd like included.