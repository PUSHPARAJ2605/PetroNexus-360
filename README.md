# PETRONEXUS 360
### Connected Digital Twin for Weather-Adaptive Steam Injection and Field-Wide Heavy Oil Operations

> **“Simulate. Predict. Validate. Operate.”**

PetroNexus 360 is an enterprise-grade industrial Digital Twin decision-support platform designed for cyclic steam stimulation (CSS), thermal recovery, and artificial lift optimization in heavy-oil fields (modeled after the **Baghewala Heavy Oil Field, Bikaner-Nagaur Basin**).

---

## 🌟 Key Features

1. **Closed-Loop Field Topology Visualization**:
   - High-fidelity interactive SVG Canvas modeling flow from **Once-Through Steam Generators (SG-01)**, through **Steam Pipelines (SP-01, SP-02)**, **Thermal Injection Wells (IW-01, IW-02)**, **Reservoir Sand Zone (R-01)**, **Post-Soak Producers (PW-01, PW-02, PW-03)**, **Sucker Rod Pumps (SRP-01, SRP-02, SRP-03)**, **Gathering Pipelines (OP-01, OP-02)**, **Booster Station (PS-01)**, to **Storage Tanks (ST-01)**.
   - Animated stream particles (**Cyan** = High-enthalpy steam, **Amber** = Stimulated heavy crude).
   - Click-to-inspect **Asset Details Drawer** with real-time gauges, time-series telemetry trends, alarms, and maintenance history.

2. **Digital Twin Operation Simulator (CORE DECISION-SUPPORT)**:
   - **Steam Injection Simulator**: Operator inputs target well, steam pressure, steam temperature, mass flow rate, injection duration, soak cycle, and ambient weather parameters.
   - **Dynamic Physics Predictions**: Calculates predicted reservoir temperature, predicted reservoir pore pressure, Marx-Langenheim heat penetration index, surface line heat loss, expected production (BPD), cumulative energy (MWh), and pipe hoop stress.
   - **Multi-Criteria Safety Engine**: Classifies operations into `GREEN (SAFE)`, `YELLOW (REVIEW REQUIRED)`, or `RED (UNSAFE)` with engineering justifications and actionable recommendations.
   - **Scenario Approval Protocol**: Operator scenario approvals recorded into immutable audit logs.
   - **Production Release Simulator**: Estimates choke valve drawdown, expected oil flow rate, water cut %, and polished rod loads.
   - **What-If Scenario Comparison**: Side-by-side comparative analysis of Conservative, Baseline, and Aggressive thermal injection strategies with trade-off charts.

3. **Weather-Adaptive Steam Optimization**:
   - Real-time thermodynamic forced convection modeling based on desert wind velocity, ambient temperature, and precipitation.
   - 7-day meteorological forecast and interactive Ambient Temp vs Heat Loss curves.
   - Suggested operational windows to reduce surface thermal dissipation.

4. **Sucker Rod Pump (SRP) & Station Diagnostics**:
   - Animated walking-beam pump kinematics running at dynamic stroke rate (SPM).
   - Early mechanical degradation detection (elevated gearbox vibration & motor thermals on SRP-03).
   - 24-hour ISO 10816 vibration spectrum tracking.

5. **Pipeline Hydraulic Anomaly Detection**:
   - Real-time differential pressure (ΔP) monitoring flagging flow restrictions, valve mispositioning, or insulation gaps on SP-02.

6. **Safety & Risk Center (HSE)**:
   - Interactive Risk Heatmap across 8 critical assets.
   - Detailed root cause analysis, failure consequences, and recommended walkdowns.

7. **Context-Aware AI Operations Copilot**:
   - Industrial operations assistant referencing live IoT telemetry, active alerts, weather forecasts, and historical simulation runs.
   - Pre-configured quick queries and open conversational interface.

8. **Operation History & Audit Trail**:
   - Chronological logging of all operator simulations, parameter changes, and scenario reviews.

9. **Reports & Analytics**:
   - Summary reports for field production and OTSG thermal balance with CSV export.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React, Socket.IO Client, React Router v7 |
| **Backend** | Node.js, Express.js, TypeScript, Socket.IO, JWT, bcryptjs, REST API |
| **Database** | PostgreSQL 18 |
| **ORM** | Prisma ORM 6.4 |
| **Telemetry** | Real-time WebSocket background sensor simulator (3.5s cycle) |

---

## 🔐 Demo Credentials

Use any of the seeded demonstration accounts on the `/login` page:

| Role | Email | Password |
|---|---|---|
| **Operator** *(Default)* | `operator@petronexus360.demo` | `Operator@360` |
| **Engineer** | `engineer@petronexus360.demo` | `Engineer@360` |
| **Admin** | `admin@petronexus360.demo` | `PetroAdmin@360` |
| **Maintenance** | `maintenance@petronexus360.demo` | `Maint@360` |
| **Safety Officer** | `safety@petronexus360.demo` | `Safety@360` |
| **Viewer** | `viewer@petronexus360.demo` | `Viewer@360` |

*Note: The login page includes a **1-Click Demo Access Panel** to instantly populate credentials.*

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** >= 18 (Tested on v24)
- **PostgreSQL** running on `localhost:5432` with user `postgres` and password `root` (or configured in `server/.env`).

### 2. Database Setup
```bash
# In PostgreSQL (psql or pgAdmin):
CREATE DATABASE petronexus360;
```

### 3. Backend Setup
```bash
cd server
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 4. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 5. Running Concurrently from Root
```bash
# In project root:
npm install
npm run dev
```

---

## 📁 Project Structure

```
PetroNexus 360/
├── client/
│   ├── src/
│   │   ├── components/       # SrpAnimation, KpiCard, StatusBadge, AssetDrawer, etc.
│   │   ├── context/          # AuthContext, SocketContext
│   │   ├── layouts/          # AppLayout, PublicLayout
│   │   ├── pages/
│   │   │   ├── public/       # LandingPage, Platform, Features, Technology, Login
│   │   │   └── app/          # Dashboard, DigitalTwin, Simulator, Wells, Pumps, etc.
│   │   ├── services/         # Axios API client
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Route guards & paths
│   │   └── main.tsx
│   └── vite.config.ts
├── server/
│   ├── prisma/
│   │   ├── schema.prisma     # Relational schema (Assets, Sensors, Simulations, etc.)
│   │   └── seed.ts           # Demo field dataset
│   ├── src/
│   │   ├── controllers/      # Auth, Dashboard, Assets, Simulations, Copilot, etc.
│   │   ├── middleware/       # JWT RBAC authMiddleware
│   │   ├── routes/           # REST endpoints
│   │   ├── services/
│   │   │   ├── digitalTwin/  # Steam, Reservoir, Production, Pump, Pipeline, Risk
│   │   │   ├── sensorSimulator/ # Real-time IoT simulator + anomaly engine
│   │   │   └── copilot/      # Industrial AI operations assistant
│   │   └── index.ts          # Express + Socket.IO server
│   └── tsconfig.json
├── package.json              # Orchestrates dev & seed commands
└── README.md
```

---

## 🛡️ Safety & Prototype Disclaimer
> **IMPORTANT:** PetroNexus 360 is an intelligent decision-support and physics-informed simulation platform. It is designed to assist operators in testing operational decisions before field execution. It does **NOT** exert direct physical supervisory control over actual industrial equipment. Any simulated approval represents human operator scenario sign-off only.
