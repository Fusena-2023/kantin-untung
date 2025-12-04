<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Kantin Untung - Financial Management App

## Project Overview
Full-stack web application for canteen financial management with role-based access control.

**Tech Stack:**
- Frontend: Quasar Framework + Vue.js
- Backend: Node.js + Express
- Database: PostgreSQL  
- Authentication: JWT
- Roles: Pegawai (Employee) & Pemilik (Owner)

## Features
### Employee (Pegawai) Role:
- Input income transactions (sales)
- Input expense transactions (operational costs)
- View own transactions only

### Owner (Pemilik) Role:
- View all transactions
- Daily & monthly reports
- User CRUD operations (add employees)
- Edit/delete transactions

## Development Guidelines
- Use Indonesian language for UI text
- Follow Vue.js composition API patterns
- Implement proper JWT token management
- Ensure role-based route protection
- Use PostgreSQL best practices for data modeling
- Implement proper error handling and validation

## Quick Start
1. Setup PostgreSQL database: `kantin_untung_db`
2. Backend: `cd backend && npm install && npm run dev`
3. Frontend: `cd frontend && npm install && npm run dev`
4. Access: http://localhost:9000 (frontend), http://localhost:3001 (backend)