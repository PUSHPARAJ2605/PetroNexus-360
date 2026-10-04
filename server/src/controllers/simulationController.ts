import { Response } from 'express';
import { PrismaClient, SimulationStatus, ApprovalStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { runDigitalTwinSimulation } from '../services/digitalTwin/riskEngine';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export async function runSimulation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      operationType = 'STEAM_INJECTION',
      wellTag = 'IW-01',
      title,
      description,
      steamPressure = 85.0,
      steamTemperature = 285.0,
      steamFlowRate = 3.0,
      injectionDurationDays = 14.0,
      soakDurationDays = 7.0,
      reservoirPressure = 45.0,
      wellheadPressure = 35.0,
      valveOpeningPct = 65.0,
      pumpSpeedSpm = 7.2,
      ambientTemperature,
      humidity,
      windSpeed,
      saveToDatabase = true,
    } = req.body;

    const liveWeather = sensorSimulator.getCurrentState().weather;

    // Run the Digital Twin simulation engine
    const output = runDigitalTwinSimulation({
      operationType,
      wellTag,
      steamPressure: parseFloat(steamPressure),
      steamTemperature: parseFloat(steamTemperature),
      steamFlowRate: parseFloat(steamFlowRate),
      injectionDurationDays: parseFloat(injectionDurationDays),
      soakDurationDays: parseFloat(soakDurationDays),
      reservoirPressure: parseFloat(reservoirPressure),
      wellheadPressure: parseFloat(wellheadPressure),
      valveOpeningPct: parseFloat(valveOpeningPct),
      pumpSpeedSpm: parseFloat(pumpSpeedSpm),
      ambientTemperature: ambientTemperature ? parseFloat(ambientTemperature) : liveWeather.temperature,
      humidity: humidity ? parseFloat(humidity) : liveWeather.humidity,
      windSpeed: windSpeed ? parseFloat(windSpeed) : liveWeather.windSpeed,
    });

    let simulationRecord = null;

    if (saveToDatabase) {
      // Find asset ID by tag
      const asset = await prisma.asset.findUnique({ where: { tag: wellTag } });
      const userId = req.user?.id || (await prisma.user.findFirst())?.id;

      if (userId) {
        simulationRecord = await prisma.simulation.create({
          data: {
            userId,
            assetId: asset?.id || null,
            type: operationType,
            title: title || `${operationType.replace('_', ' ')} Simulation (${wellTag})`,
            description: description || `Simulated ${steamPressure} bar @ ${steamTemperature}°C for ${injectionDurationDays} days`,
            status: output.status as SimulationStatus,
            approvalStatus: ApprovalStatus.PENDING,
          },
        });

        await prisma.simulationInput.create({
          data: {
            simulationId: simulationRecord.id,
            steamPressure: parseFloat(steamPressure),
            steamTemperature: parseFloat(steamTemperature),
            steamFlowRate: parseFloat(steamFlowRate),
            injectionDuration: parseFloat(injectionDurationDays),
            soakDuration: parseFloat(soakDurationDays),
            reservoirPressure: parseFloat(reservoirPressure),
            wellheadPressure: parseFloat(wellheadPressure),
            valveOpeningPct: parseFloat(valveOpeningPct),
            pumpSpeed: parseFloat(pumpSpeedSpm),
            ambientTemperature: ambientTemperature ? parseFloat(ambientTemperature) : liveWeather.temperature,
            humidity: humidity ? parseFloat(humidity) : liveWeather.humidity,
            windSpeed: windSpeed ? parseFloat(windSpeed) : liveWeather.windSpeed,
          },
        });

        await prisma.simulationResult.create({
          data: {
            simulationId: simulationRecord.id,
            predReservoirTemp: output.summary.predictedReservoirTemp,
            predReservoirPressure: output.summary.predictedReservoirPressure,
            heatPenetrationIndex: output.summary.heatPenetrationIndex,
            estimatedHeatLoss: output.summary.estimatedHeatLoss,
            steamConsumption: output.summary.steamConsumption,
            estimatedOilMobility: output.summary.estimatedOilMobility,
            expectedProduction: output.summary.expectedProduction,
            energyRequirement: output.summary.energyRequirement,
            pipelineStress: output.summary.pipelineStress,
            wellIntegrityRisk: output.wellIntegrityRisk,
            riskScore: output.riskScore,
            status: output.status as SimulationStatus,
            reasons: output.reasons,
            recommendations: output.recommendations,
          },
        });

        // Audit entry
        await prisma.auditLog.create({
          data: {
            userId,
            assetId: asset?.id || null,
            simulationId: simulationRecord.id,
            action: 'RUN_SIMULATION',
            details: `Ran ${operationType} simulation for ${wellTag}. Status: ${output.status} (Score: ${output.riskScore}).`,
            newValue: `P: ${steamPressure} bar, T: ${steamTemperature} °C`,
          },
        });
      }
    }

    res.json({
      simulationId: simulationRecord?.id || 'transient-sim-' + Date.now(),
      record: simulationRecord,
      output,
      disclaimer: 'Prototype simulation – not for real field control.',
    });
  } catch (error: any) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: 'Failed to process digital twin simulation' });
  }
}

export async function getSimulations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { type, status } = req.query;
    const where: any = {};
    if (type) where.type = String(type);
    if (status) where.status = String(status);

    const simulations = await prisma.simulation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        asset: { select: { id: true, tag: true, name: true, type: true } },
        input: true,
        result: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(simulations);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve simulation history' });
  }
}

export async function getSimulationById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const simulationId = req.params.id as string;
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        asset: true,
        input: true,
        result: true,
      },
    });

    if (!simulation) {
      res.status(404).json({ error: 'Simulation not found' });
      return;
    }

    res.json(simulation);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
}

export async function approveSimulation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const simulationId = req.params.id as string;
    const { notes } = req.body;

    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { asset: true },
    });

    if (!simulation) {
      res.status(404).json({ error: 'Simulation not found' });
      return;
    }

    if (simulation.status === 'UNSAFE') {
      res.status(400).json({ error: 'Cannot approve a simulation flagged as UNSAFE. Modify parameters first.' });
      return;
    }

    const updated = await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        assetId: simulation.assetId,
        simulationId: simulation.id,
        action: 'SIMULATION_APPROVED',
        details: `Approved for Prototype Operational Scenario: "${simulation.title}". ${notes ? 'Notes: ' + notes : ''}`,
        approvalStatus: 'APPROVED',
      },
    });

    res.json({
      message: 'Approved for Prototype Operational Scenario',
      simulation: updated,
      disclaimer: 'This represents operator approval for a simulated prototype scenario only. Real field equipment is unaffected.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to approve simulation' });
  }
}

export async function compareScenarios(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { scenarios } = req.body;
    if (!scenarios || !Array.isArray(scenarios) || scenarios.length < 2) {
      res.status(400).json({ error: 'Provide at least 2 scenarios to compare' });
      return;
    }

    const results = [];
    const liveWeather = sensorSimulator.getCurrentState().weather;

    for (let i = 0; i < scenarios.length; i++) {
      const item = scenarios[i];
      let pPressure = 80 + i * 5;
      let pRate = 2.8 + i * 0.2;
      let pTemp = 280 + i * 5;
      let pDuration = 14;
      let label = `Scenario ${String.fromCharCode(65 + i)}`;

      if (typeof item === 'string') {
        const sim = await prisma.simulation.findUnique({
          where: { id: item },
          include: { input: true, result: true },
        });
        if (sim && sim.input) {
          pPressure = sim.input.steamPressure || pPressure;
          pRate = sim.input.steamFlowRate || pRate;
          pTemp = sim.input.steamTemperature || pTemp;
          pDuration = sim.input.injectionDuration || pDuration;
          label = sim.title || label;
        }
      } else if (typeof item === 'object') {
        pPressure = item.steamPressure ?? pPressure;
        pRate = item.steamFlowRate ?? pRate;
        pTemp = item.steamTemperature ?? pTemp;
        pDuration = item.injectionDurationDays ?? pDuration;
        label = item.label || label;
      }

      const output = runDigitalTwinSimulation({
        operationType: 'STEAM_INJECTION',
        steamPressure: pPressure,
        steamTemperature: pTemp,
        steamFlowRate: pRate,
        injectionDurationDays: pDuration,
        ambientTemperature: liveWeather.temperature,
        windSpeed: liveWeather.windSpeed,
        humidity: liveWeather.humidity,
      });

      results.push({
        label,
        inputs: {
          steamPressure: pPressure,
          steamFlowRate: pRate,
          steamTemperature: pTemp,
          injectionDuration: pDuration,
        },
        status: output.status,
        riskScore: output.riskScore,
        wellIntegrityRisk: output.wellIntegrityRisk,
        predictedReservoirTemp: output.summary.predictedReservoirTemp,
        predictedReservoirPressure: output.summary.predictedReservoirPressure,
        expectedProduction: output.summary.expectedProduction,
        steamConsumption: output.summary.steamConsumption,
        energyRequirement: output.summary.energyRequirement,
        heatLoss: output.summary.estimatedHeatLoss,
        pipelineStress: output.summary.pipelineStress,
        reasons: output.reasons,
        recommendations: output.recommendations,
      });
    }

    res.json({
      scenarios: results,
      tradeOffs: [
        'Higher steam injection pressure accelerates heavy oil mobility and peak BPD, but reduces reservoir fracture margin and raises pipeline hoop stress.',
        'Moderate pressure schedules consume significantly less thermal energy (MWh) and yield more sustainable SOR over a 14-day CSS cycle.',
      ],
      disclaimer: 'Prototype comparative analysis. Operator evaluation required before physical decision.',
    });
  } catch (error: any) {
    console.error('Error comparing scenarios:', error);
    res.status(500).json({ error: 'Failed to process scenario comparison' });
  }
}
