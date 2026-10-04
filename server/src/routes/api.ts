import { Router } from 'express';
import { login, logout, getCurrentUser, getDemoAccounts } from '../controllers/authController';
import { getDashboardOverview, getDashboardTrends } from '../controllers/dashboardController';
import { getAssets, getAssetById, getAssetReadings } from '../controllers/assetController';
import { getWells, getWellById } from '../controllers/wellController';
import { getPumps, getPumpById } from '../controllers/pumpController';
import { getPipelines, getPipelineById } from '../controllers/pipelineController';
import { getCurrentWeather, getWeatherForecast } from '../controllers/weatherController';
import { runSimulation, getSimulations, getSimulationById, approveSimulation, compareScenarios } from '../controllers/simulationController';
import { getAlerts, updateAlert, createAlert, resolveAllAlerts } from '../controllers/alertController';
import { getMaintenanceOverview, createMaintenanceRecord } from '../controllers/maintenanceController';
import { getReports, exportReportCsv } from '../controllers/reportController';
import { queryCopilot, verifyCopilotKey } from '../controllers/copilotController';
import { getAuditLogs } from '../controllers/auditController';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const router = Router();

// Auth Endpoints
router.post('/auth/login', login);
router.post('/auth/logout', authenticateToken, logout);
router.get('/auth/me', authenticateToken, getCurrentUser);
router.get('/auth/demo-users', getDemoAccounts);

// Dashboard
router.get('/dashboard/overview', getDashboardOverview);
router.get('/dashboard/trends', getDashboardTrends);

// Assets
router.get('/assets', getAssets);
router.get('/assets/:id', getAssetById);
router.get('/assets/:id/readings', getAssetReadings);

// Wells
router.get('/wells', getWells);
router.get('/wells/:id', getWellById);

// Pumps
router.get('/pumps', getPumps);
router.get('/pumps/:id', getPumpById);

// Pipelines
router.get('/pipelines', getPipelines);
router.get('/pipelines/:id', getPipelineById);

// Weather
router.get('/weather/current', getCurrentWeather);
router.get('/weather/forecast', getWeatherForecast);

// Simulations
router.post('/simulations', runSimulation);
router.get('/simulations', getSimulations);
router.get('/simulations/:id', getSimulationById);
router.post('/simulations/:id/approve', authenticateToken, approveSimulation);

// Scenarios
router.post('/scenarios/compare', compareScenarios);

// Alerts
router.get('/alerts', getAlerts);
router.post('/alerts', authenticateToken, createAlert);
router.post('/alerts/resolve-all', authenticateToken, resolveAllAlerts);
router.patch('/alerts/:id', authenticateToken, updateAlert);

// Maintenance
router.get('/maintenance', getMaintenanceOverview);
router.post('/maintenance', authenticateToken, createMaintenanceRecord);

// Reports
router.get('/reports', getReports);
router.get('/reports/export', exportReportCsv);

// Copilot
router.post('/copilot/query', queryCopilot);
router.post('/copilot/verify-key', verifyCopilotKey);

// Operation History / Audit Trail
router.get('/history', getAuditLogs);

// Admin Users
router.get('/admin/users', authenticateToken, authorizeRoles('ADMIN'), getUsers);
router.post('/admin/users', authenticateToken, authorizeRoles('ADMIN'), createUser);
router.patch('/admin/users/:id', authenticateToken, authorizeRoles('ADMIN'), updateUser);
router.delete('/admin/users/:id', authenticateToken, authorizeRoles('ADMIN'), deleteUser);

// Simulator Live State & Controls
router.get('/simulator/state', (req, res) => {
  res.json(sensorSimulator.getCurrentState());
});

router.post('/simulator/anomaly-toggle', (req, res) => {
  const { active } = req.body;
  sensorSimulator.setAnomalyState(Boolean(active));
  res.json({
    message: `Anomaly simulation ${active ? 'activated' : 'deactivated'}`,
    currentState: sensorSimulator.getCurrentState(),
  });
});

router.post('/simulator/resolve-asset', async (req, res) => {
  const { assetTag } = req.body;
  const tag = assetTag || 'ALL';
  const updatedState = sensorSimulator.resolveAssetAnomaly(tag);

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    if (tag === 'ALL') {
      await prisma.alert.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
    } else {
      await prisma.alert.updateMany({
        where: { asset: { tag }, status: 'ACTIVE' },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
    }
  } catch (err) {
    // Graceful fallback in prototype/offline mode
  }

  res.json({
    success: true,
    message: `Asset ${tag} anomaly resolved and operating baseline restored.`,
    currentState: updatedState,
  });
});

router.post('/simulator/fault-asset', (req, res) => {
  const { assetTag } = req.body;
  const tag = assetTag || 'SP-02';
  const updatedState = sensorSimulator.triggerAssetAnomaly(tag);
  res.json({
    success: true,
    message: `Diagnostic fault simulated for asset ${tag}.`,
    currentState: updatedState,
  });
});

export default router;
