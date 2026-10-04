"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting PetroNexus 360 database seed...');
    // Clear existing records
    await prisma.auditLog.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.maintenanceRecord.deleteMany();
    await prisma.scenarioItem.deleteMany();
    await prisma.scenario.deleteMany();
    await prisma.simulationResult.deleteMany();
    await prisma.simulationInput.deleteMany();
    await prisma.simulation.deleteMany();
    await prisma.sensorReading.deleteMany();
    await prisma.sensor.deleteMany();
    await prisma.well.deleteMany();
    await prisma.steamGenerator.deleteMany();
    await prisma.pipeline.deleteMany();
    await prisma.pump.deleteMany();
    await prisma.pumpStation.deleteMany();
    await prisma.storageTank.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.weatherReading.deleteMany();
    await prisma.field.deleteMany();
    await prisma.report.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleaned existing tables');
    // Seed Users
    const adminPassword = await bcryptjs_1.default.hash('PetroAdmin@360', 10);
    const operatorPassword = await bcryptjs_1.default.hash('Operator@360', 10);
    const engineerPassword = await bcryptjs_1.default.hash('Engineer@360', 10);
    const maintPassword = await bcryptjs_1.default.hash('Maint@360', 10);
    const safetyPassword = await bcryptjs_1.default.hash('Safety@360', 10);
    const viewerPassword = await bcryptjs_1.default.hash('Viewer@360', 10);
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@petronexus360.demo',
            password: adminPassword,
            name: 'Elena Rostova (Admin)',
            role: client_1.Role.ADMIN,
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        },
    });
    const operatorUser = await prisma.user.create({
        data: {
            email: 'operator@petronexus360.demo',
            password: operatorPassword,
            name: 'Vikramaditya Rathore (Chief Operator)',
            role: client_1.Role.OPERATOR,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
    });
    const engineerUser = await prisma.user.create({
        data: {
            email: 'engineer@petronexus360.demo',
            password: engineerPassword,
            name: 'Dr. Sarah Sterling (Reservoir Engineer)',
            role: client_1.Role.ENGINEER,
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        },
    });
    await prisma.user.create({
        data: {
            email: 'maintenance@petronexus360.demo',
            password: maintPassword,
            name: 'Marcus Chen (Rotating Equipment Lead)',
            role: client_1.Role.MAINTENANCE_ENGINEER,
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        },
    });
    await prisma.user.create({
        data: {
            email: 'safety@petronexus360.demo',
            password: safetyPassword,
            name: 'Aisha Al-Mansoor (HSE Officer)',
            role: client_1.Role.SAFETY_OFFICER,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
    });
    await prisma.user.create({
        data: {
            email: 'viewer@petronexus360.demo',
            password: viewerPassword,
            name: 'Field Auditor (Observer)',
            role: client_1.Role.VIEWER,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        },
    });
    console.log('✅ Created demo users');
    // Seed Field
    const field = await prisma.field.create({
        data: {
            code: 'BAGHEWALA-01',
            name: 'Baghewala Demo Field',
            location: 'Bikaner-Nagaur Basin, Rajasthan, India',
            description: 'Heavy Oil Reservoir - Cyclic Steam Stimulation (CSS) and Thermal Recovery Operations',
            latitude: 27.95,
            longitude: 72.85,
            healthScore: 91.4,
        },
    });
    console.log(`✅ Created Field: ${field.name}`);
    // Seed Weather Readings
    const now = new Date();
    const weatherCurrent = await prisma.weatherReading.create({
        data: {
            fieldId: field.id,
            temperature: 34.2,
            humidity: 38.0,
            windSpeed: 21.5,
            rainfall: 0.0,
            pressure: 1008.4,
            impactLevel: 'MODERATE',
            estimatedHeatLoss: 6.8,
            timestamp: now,
        },
    });
    // Historical weather for trends
    for (let i = 1; i <= 6; i++) {
        const pastDate = new Date(now.getTime() - i * 3600 * 1000 * 4);
        await prisma.weatherReading.create({
            data: {
                fieldId: field.id,
                temperature: 34.2 - i * 0.8 + Math.sin(i) * 2,
                humidity: 38 + i * 2,
                windSpeed: 18 + i * 1.2,
                rainfall: 0.0,
                pressure: 1009 - i * 0.2,
                impactLevel: i > 3 ? 'LOW' : 'MODERATE',
                estimatedHeatLoss: 5.5 + i * 0.3,
                timestamp: pastDate,
            },
        });
    }
    // Helper for creating assets
    const createAsset = async (tag, name, type, status, healthScore, riskLevel, description, metadata) => {
        return prisma.asset.create({
            data: {
                fieldId: field.id,
                tag,
                name,
                type,
                status,
                healthScore,
                riskLevel,
                description,
                metadata: metadata || {},
            },
        });
    };
    // 1. Steam Generator SG-01
    const sg01 = await createAsset('SG-01', 'Once-Through Steam Generator #1', 'STEAM_GENERATOR', client_1.AssetStatus.NORMAL, 94.5, 'LOW', 'High-pressure thermal OTSG supplying continuous cyclic steam to injection headers');
    await prisma.steamGenerator.create({
        data: {
            assetId: sg01.id,
            capacity: 5.0,
            pressure: 88.0,
            temperature: 289.0,
            steamQuality: 82.0,
            waterRate: 5.2,
            fuelRate: 380.0,
            efficiency: 88.5,
        },
    });
    // 2. Steam Pipeline SP-01
    const sp01 = await createAsset('SP-01', 'Main Header to IW-01 Steam Line', 'STEAM_PIPELINE', client_1.AssetStatus.NORMAL, 92.0, 'LOW', 'Insulated 6-inch high-temp steam transit line feeding Injection Well IW-01');
    await prisma.pipeline.create({
        data: {
            assetId: sp01.id,
            fromAsset: 'SG-01',
            toAsset: 'IW-01',
            length: 450.0,
            diameter: 6.0,
            inletPressure: 88.0,
            outletPressure: 86.0,
            temperature: 273.0,
            flowRate: 2.9,
            heatLossRate: 6.2,
            leakRisk: 'LOW',
        },
    });
    // 3. Steam Pipeline SP-02 (Anomaly / Review condition)
    const sp02 = await createAsset('SP-02', 'Main Header to IW-02 Steam Line', 'STEAM_PIPELINE', client_1.AssetStatus.WARNING, 74.0, 'HIGH', 'Elevated pressure drop and surface heat loss detected along pipeline section 3-B');
    await prisma.pipeline.create({
        data: {
            assetId: sp02.id,
            fromAsset: 'SG-01',
            toAsset: 'IW-02',
            length: 620.0,
            diameter: 6.0,
            inletPressure: 88.0,
            outletPressure: 81.2,
            temperature: 265.0,
            flowRate: 2.1,
            heatLossRate: 8.8,
            leakRisk: 'HIGH',
        },
    });
    // 4. Injection Well IW-01
    const iw01 = await createAsset('IW-01', 'Thermal Injection Well #1', 'INJECTION_WELL', client_1.AssetStatus.NORMAL, 95.0, 'LOW', 'Primary cyclic steam injection well targeting upper heavy-oil sand formation');
    await prisma.well.create({
        data: {
            assetId: iw01.id,
            type: 'INJECTION',
            reservoirZone: 'R-01',
            depth: 1150.0,
            pressure: 84.0,
            temperature: 268.0,
            steamRate: 2.9,
            cssCycle: 4,
            lastCssDate: new Date(now.getTime() - 1000 * 3600 * 24 * 12),
            healthScore: 95.0,
        },
    });
    // 5. Injection Well IW-02
    const iw02 = await createAsset('IW-02', 'Thermal Injection Well #2', 'INJECTION_WELL', client_1.AssetStatus.NORMAL, 89.0, 'LOW', 'Secondary steam injection well serving peripheral reservoir zone');
    await prisma.well.create({
        data: {
            assetId: iw02.id,
            type: 'INJECTION',
            reservoirZone: 'R-01',
            depth: 1180.0,
            pressure: 79.5,
            temperature: 255.0,
            steamRate: 2.1,
            cssCycle: 3,
            lastCssDate: new Date(now.getTime() - 1000 * 3600 * 24 * 25),
            healthScore: 89.0,
        },
    });
    // 6. Production Wells PW-01, PW-02, PW-03, BW-101, BW-102
    const pw01 = await createAsset('PW-01', 'Heavy Oil Producer #1', 'PRODUCTION_WELL', client_1.AssetStatus.NORMAL, 93.0, 'LOW', 'Actively producing stimulated heavy crude following 14-day steam soak');
    await prisma.well.create({
        data: {
            assetId: pw01.id,
            type: 'PRODUCTION',
            reservoirZone: 'R-01',
            depth: 1140.0,
            pressure: 38.5,
            temperature: 142.0,
            oilRate: 440.0,
            cssCycle: 4,
            healthScore: 93.0,
        },
    });
    const pw02 = await createAsset('PW-02', 'Heavy Oil Producer #2', 'PRODUCTION_WELL', client_1.AssetStatus.NORMAL, 91.0, 'LOW', 'Steady producer in cycle 3; high mobility zone with balanced water cut');
    await prisma.well.create({
        data: {
            assetId: pw02.id,
            type: 'PRODUCTION',
            reservoirZone: 'R-01',
            depth: 1160.0,
            pressure: 35.0,
            temperature: 136.0,
            oilRate: 390.0,
            cssCycle: 3,
            healthScore: 91.0,
        },
    });
    const pw03 = await createAsset('PW-03', 'Heavy Oil Producer #3', 'PRODUCTION_WELL', client_1.AssetStatus.NORMAL, 88.0, 'LOW', 'Producer connected to SRP-03; steady fluid extraction under thermal drawdown');
    await prisma.well.create({
        data: {
            assetId: pw03.id,
            type: 'PRODUCTION',
            reservoirZone: 'R-01',
            depth: 1130.0,
            pressure: 41.0,
            temperature: 148.0,
            oilRate: 418.0,
            cssCycle: 5,
            healthScore: 88.0,
        },
    });
    const bw101 = await createAsset('BW-101', 'Observation & Backup Well #1', 'PRODUCTION_WELL', client_1.AssetStatus.NORMAL, 96.0, 'LOW', 'Observation well monitoring reservoir heat front temperature and pressure');
    await prisma.well.create({
        data: {
            assetId: bw101.id,
            type: 'BACKUP',
            reservoirZone: 'R-01',
            depth: 1150.0,
            pressure: 28.0,
            temperature: 85.0,
            oilRate: 0.0,
            cssCycle: 1,
            healthScore: 96.0,
        },
    });
    const bw102 = await createAsset('BW-102', 'Observation & Backup Well #2', 'PRODUCTION_WELL', client_1.AssetStatus.NORMAL, 95.0, 'LOW', 'Standby observation well on western reservoir boundary');
    await prisma.well.create({
        data: {
            assetId: bw102.id,
            type: 'BACKUP',
            reservoirZone: 'R-01',
            depth: 1175.0,
            pressure: 26.5,
            temperature: 82.0,
            oilRate: 0.0,
            cssCycle: 1,
            healthScore: 95.0,
        },
    });
    // 7. Sucker Rod Pumps SRP-01, SRP-02, SRP-03
    const srp01 = await createAsset('SRP-01', 'Beam Pumping Unit #1', 'SRP', client_1.AssetStatus.NORMAL, 92.0, 'LOW', 'Conventional beam pump operating smoothly on PW-01 wellhead');
    await prisma.pump.create({
        data: {
            assetId: srp01.id,
            pumpType: 'SRP',
            strokeRate: 7.2,
            strokeLength: 144.0,
            motorCurrent: 24.5,
            motorTemp: 62.0,
            vibration: 2.1,
            polishedRodLoad: 18200.0,
            efficiency: 89.0,
            runtimeHours: 4320.0,
        },
    });
    const srp02 = await createAsset('SRP-02', 'Beam Pumping Unit #2', 'SRP', client_1.AssetStatus.NORMAL, 88.0, 'LOW', 'Beam pump unit operating on PW-02');
    await prisma.pump.create({
        data: {
            assetId: srp02.id,
            pumpType: 'SRP',
            strokeRate: 6.8,
            strokeLength: 144.0,
            motorCurrent: 23.8,
            motorTemp: 64.0,
            vibration: 2.4,
            polishedRodLoad: 17800.0,
            efficiency: 87.0,
            runtimeHours: 3980.0,
        },
    });
    const srp03 = await createAsset('SRP-03', 'Beam Pumping Unit #3', 'SRP', client_1.AssetStatus.WARNING, 68.0, 'MODERATE', 'Elevated gearbox vibration and motor temperature: potential mechanical degradation');
    await prisma.pump.create({
        data: {
            assetId: srp03.id,
            pumpType: 'SRP',
            strokeRate: 7.5,
            strokeLength: 144.0,
            motorCurrent: 29.2,
            motorTemp: 78.5,
            vibration: 5.8,
            polishedRodLoad: 21400.0,
            efficiency: 68.0,
            runtimeHours: 5120.0,
        },
    });
    // 8. Production Pipelines OP-01, OP-02
    const op01 = await createAsset('OP-01', 'PW-01/02 Oil Gathering Trunk', 'PRODUCTION_PIPELINE', client_1.AssetStatus.NORMAL, 94.0, 'LOW', 'Heated and insulated crude gathering line connecting PW-01 & PW-02 to PS-01');
    await prisma.pipeline.create({
        data: {
            assetId: op01.id,
            fromAsset: 'PW-01',
            toAsset: 'PS-01',
            length: 520.0,
            diameter: 8.0,
            inletPressure: 34.0,
            outletPressure: 28.5,
            temperature: 115.0,
            flowRate: 52.0,
            heatLossRate: 4.1,
            leakRisk: 'LOW',
        },
    });
    const op02 = await createAsset('OP-02', 'PW-03 Oil Gathering Line', 'PRODUCTION_PIPELINE', client_1.AssetStatus.NORMAL, 93.0, 'LOW', 'Gathering pipeline from PW-03 to Booster Pump Station PS-01');
    await prisma.pipeline.create({
        data: {
            assetId: op02.id,
            fromAsset: 'PW-03',
            toAsset: 'PS-01',
            length: 410.0,
            diameter: 8.0,
            inletPressure: 38.0,
            outletPressure: 31.0,
            temperature: 120.0,
            flowRate: 38.0,
            heatLossRate: 3.9,
            leakRisk: 'LOW',
        },
    });
    // 9. Pump Station PS-01
    const ps01 = await createAsset('PS-01', 'Field Central Booster Pump Station', 'PUMP_STATION', client_1.AssetStatus.NORMAL, 91.0, 'LOW', 'Multi-stage positive displacement boosting manifold delivering treated crude to storage');
    await prisma.pumpStation.create({
        data: {
            assetId: ps01.id,
            inflowRate: 90.0,
            dischargePressure: 45.0,
            powerKW: 180.0,
            status: 'RUNNING',
        },
    });
    // 10. Storage Tank ST-01
    const st01 = await createAsset('ST-01', 'Crude Thermal Storage Tank #1', 'STORAGE_TANK', client_1.AssetStatus.NORMAL, 98.0, 'LOW', 'Insulated 5,000 m³ crude storage tank equipped with internal steam heating coils');
    await prisma.storageTank.create({
        data: {
            assetId: st01.id,
            capacityM3: 5000.0,
            currentLevel: 68.4,
            temperature: 65.0,
            netVolumeM3: 3420.0,
        },
    });
    console.log('✅ Created field assets and component specifications');
    // Seed Sensors for real-time monitoring
    const allAssets = [sg01, sp01, sp02, iw01, iw02, pw01, pw02, pw03, bw101, bw102, srp01, srp02, srp03, op01, op02, ps01, st01];
    const sensorDefinitions = [
        { asset: sg01, tag: 'SG01_PT', name: 'OTSG Discharge Pressure', type: 'PRESSURE', unit: 'bar', min: 0, max: 120, val: 88.0 },
        { asset: sg01, tag: 'SG01_TT', name: 'OTSG Steam Temperature', type: 'TEMPERATURE', unit: '°C', min: 0, max: 350, val: 289.0 },
        { asset: sg01, tag: 'SG01_FT', name: 'OTSG Steam Flow Rate', type: 'FLOW', unit: 't/hr', min: 0, max: 10, val: 5.0 },
        { asset: sp01, tag: 'SP01_PT_IN', name: 'SP-01 Inlet Pressure', type: 'PRESSURE', unit: 'bar', min: 0, max: 120, val: 88.0 },
        { asset: sp01, tag: 'SP01_PT_OUT', name: 'SP-01 Delivery Pressure', type: 'PRESSURE', unit: 'bar', min: 0, max: 120, val: 86.0 },
        { asset: sp01, tag: 'SP01_TT', name: 'SP-01 Core Temperature', type: 'TEMPERATURE', unit: '°C', min: 0, max: 350, val: 273.0 },
        { asset: sp02, tag: 'SP02_PT_IN', name: 'SP-02 Inlet Pressure', type: 'PRESSURE', unit: 'bar', min: 0, max: 120, val: 88.0 },
        { asset: sp02, tag: 'SP02_PT_OUT', name: 'SP-02 Delivery Pressure', type: 'PRESSURE', unit: 'bar', min: 0, max: 120, val: 81.2 },
        { asset: sp02, tag: 'SP02_TT', name: 'SP-02 Core Temperature', type: 'TEMPERATURE', unit: '°C', min: 0, max: 350, val: 265.0 },
        { asset: iw01, tag: 'IW01_WHP', name: 'IW-01 Wellhead Pressure', type: 'PRESSURE', unit: 'bar', min: 0, max: 120, val: 84.0 },
        { asset: iw01, tag: 'IW01_BHT', name: 'IW-01 Bottomhole Temp', type: 'TEMPERATURE', unit: '°C', min: 0, max: 350, val: 268.0 },
        { asset: pw01, tag: 'PW01_WHP', name: 'PW-01 Wellhead Pressure', type: 'PRESSURE', unit: 'bar', min: 0, max: 80, val: 38.5 },
        { asset: pw01, tag: 'PW01_WHT', name: 'PW-01 Fluid Temperature', type: 'TEMPERATURE', unit: '°C', min: 0, max: 200, val: 142.0 },
        { asset: pw01, tag: 'PW01_OFT', name: 'PW-01 Oil Production Rate', type: 'FLOW', unit: 'BPD', min: 0, max: 1000, val: 440.0 },
        { asset: srp03, tag: 'SRP03_VIB', name: 'SRP-03 Gearbox Vibration', type: 'VIBRATION', unit: 'mm/s', min: 0, max: 15, val: 5.8 },
        { asset: srp03, tag: 'SRP03_MOT', name: 'SRP-03 Motor Temperature', type: 'TEMPERATURE', unit: '°C', min: 0, max: 120, val: 78.5 },
        { asset: srp03, tag: 'SRP03_CUR', name: 'SRP-03 Motor Current', type: 'CURRENT', unit: 'A', min: 0, max: 50, val: 29.2 },
        { asset: st01, tag: 'ST01_LVL', name: 'ST-01 Oil Level', type: 'LEVEL', unit: '%', min: 0, max: 100, val: 68.4 },
    ];
    for (const s of sensorDefinitions) {
        const sensor = await prisma.sensor.create({
            data: {
                assetId: s.asset.id,
                tag: s.tag,
                name: s.name,
                type: s.type,
                unit: s.unit,
                minRange: s.min,
                maxRange: s.max,
                lastValue: s.val,
                lastReadAt: now,
            },
        });
        // Create 12 initial history points for each sensor
        for (let h = 12; h >= 0; h--) {
            const readingTime = new Date(now.getTime() - h * 1000 * 300);
            const jitter = (Math.sin(h + s.val) * 0.03) * s.val;
            await prisma.sensorReading.create({
                data: {
                    sensorId: sensor.id,
                    value: parseFloat((s.val + jitter).toFixed(2)),
                    timestamp: readingTime,
                },
            });
        }
    }
    console.log('✅ Created sensor network and initial historical telemetry');
    // Seed Alerts
    await prisma.alert.create({
        data: {
            assetId: sp02.id,
            severity: client_1.Severity.HIGH,
            category: 'PIPELINE',
            message: 'Abnormal pressure drop detected across SP-02 section 3-B. Inlet: 88 bar, Outlet: 81.2 bar (Differential: 6.8 bar exceeding 4.0 bar threshold).',
            status: client_1.AlertStatus.ACTIVE,
            assignedTo: engineerUser.id,
            notes: 'Investigating potential valve constriction or localized insulation damage. Recommended walkdown before increasing injection schedule.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 18),
        },
    });
    await prisma.alert.create({
        data: {
            assetId: srp03.id,
            severity: client_1.Severity.WARNING,
            category: 'PUMP',
            message: 'SRP-03 gearbox vibration elevated to 5.8 mm/s with motor casing temperature at 78.5°C. Potential mechanical degradation detected.',
            status: client_1.AlertStatus.ACTIVE,
            assignedTo: adminUser.id,
            notes: 'Greasing schedule checked. Suggested vibration spectrum analysis and load cell recalibration.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 34),
        },
    });
    await prisma.alert.create({
        data: {
            assetId: sg01.id,
            severity: client_1.Severity.INFO,
            category: 'STEAM',
            message: 'OTSG automatic blowdown completed successfully. Feedwater TDS normal.',
            status: client_1.AlertStatus.ACKNOWLEDGED,
            assignedTo: operatorUser.id,
            notes: 'Logged for daily thermal balance report.',
            timestamp: new Date(now.getTime() - 1000 * 3600 * 3),
        },
    });
    console.log('✅ Created active and acknowledged field alerts');
    // Seed Maintenance Records
    await prisma.maintenanceRecord.create({
        data: {
            assetId: srp03.id,
            title: 'Inspect Beam Bearing & Gearbox Lubrication',
            description: 'Check gearbox oil cleanliness, inspect wrist pin bearings, and verify polished rod packing following high vibration alarms.',
            maintenanceType: 'CORRECTIVE',
            priority: 'HIGH',
            status: 'SCHEDULED',
            scheduledDate: new Date(now.getTime() + 1000 * 3600 * 24),
            technician: 'Marcus Chen',
        },
    });
    await prisma.maintenanceRecord.create({
        data: {
            assetId: sp02.id,
            title: 'Ultrasonic Wall Thickness & Thermal Cam Inspection',
            description: 'Survey SP-02 line with FLIR thermal camera to identify localized insulation gaps or steam condensation traps.',
            maintenanceType: 'INSPECTION',
            priority: 'HIGH',
            status: 'SCHEDULED',
            scheduledDate: new Date(now.getTime() + 1000 * 3600 * 36),
            technician: 'Pipeline Integrity Team',
        },
    });
    await prisma.maintenanceRecord.create({
        data: {
            assetId: sg01.id,
            title: 'Quarterly OTSG Safety Relief Valve Recalibration',
            description: 'Bench tested primary and secondary boiler relief valves up to 105 bar cracking pressure. All within API 520 tolerance.',
            maintenanceType: 'PREVENTIVE',
            priority: 'MEDIUM',
            status: 'COMPLETED',
            scheduledDate: new Date(now.getTime() - 1000 * 3600 * 24 * 7),
            completedDate: new Date(now.getTime() - 1000 * 3600 * 24 * 6),
            findings: 'All spring pack assemblies in pristine condition. Zero seat leakage.',
            technician: 'Thermal Boiler Services Ltd.',
        },
    });
    console.log('✅ Created maintenance records');
    // Seed Simulations
    const sim1 = await prisma.simulation.create({
        data: {
            userId: operatorUser.id,
            assetId: iw01.id,
            type: 'STEAM_INJECTION',
            title: 'CSS Cycle 4 Injection Optimization - IW-01',
            description: 'Evaluation of 86 bar steam injection under moderate ambient wind speed (21 km/h)',
            status: client_1.SimulationStatus.SAFE,
            approvalStatus: client_1.ApprovalStatus.APPROVED,
            createdAt: new Date(now.getTime() - 1000 * 3600 * 5),
        },
    });
    await prisma.simulationInput.create({
        data: {
            simulationId: sim1.id,
            steamPressure: 86.0,
            steamTemperature: 285.0,
            steamFlowRate: 3.0,
            injectionDuration: 14.0,
            soakDuration: 7.0,
            ambientTemperature: 34.0,
            humidity: 38.0,
            windSpeed: 21.0,
        },
    });
    await prisma.simulationResult.create({
        data: {
            simulationId: sim1.id,
            predReservoirTemp: 198.4,
            predReservoirPressure: 72.8,
            heatPenetrationIndex: 82.5,
            estimatedHeatLoss: 6.4,
            steamConsumption: 1008.0,
            estimatedOilMobility: 4.8,
            expectedProduction: 495.0,
            energyRequirement: 742.0,
            pipelineStress: 48.2,
            wellIntegrityRisk: 'LOW',
            riskScore: 18.0,
            status: client_1.SimulationStatus.SAFE,
            reasons: [
                'Predicted reservoir pressure remains comfortably below hydraulic fracture ceiling (94 bar)',
                'Heat penetration index indicates effective mobilization of heavy crude within 45m radius',
                'Pipeline thermal stress within allowable ASME B31.3 limit',
            ],
            recommendations: [
                'Safe to proceed with planned 14-day injection schedule',
                'Maintain daily monitoring of surface line heat loss if wind speed exceeds 25 km/h',
            ],
        },
    });
    const sim2 = await prisma.simulation.create({
        data: {
            userId: engineerUser.id,
            assetId: iw02.id,
            type: 'STEAM_INJECTION',
            title: 'Aggressive High-Rate Injection Test - IW-02',
            description: 'Testing 92 bar steam injection to accelerate thermal breakthrough',
            status: client_1.SimulationStatus.REVIEW,
            approvalStatus: client_1.ApprovalStatus.PENDING,
            createdAt: new Date(now.getTime() - 1000 * 3600 * 2),
        },
    });
    await prisma.simulationInput.create({
        data: {
            simulationId: sim2.id,
            steamPressure: 92.0,
            steamTemperature: 295.0,
            steamFlowRate: 3.6,
            injectionDuration: 18.0,
            soakDuration: 10.0,
            ambientTemperature: 35.0,
            humidity: 35.0,
            windSpeed: 26.0,
        },
    });
    await prisma.simulationResult.create({
        data: {
            simulationId: sim2.id,
            predReservoirTemp: 218.0,
            predReservoirPressure: 89.2,
            heatPenetrationIndex: 91.0,
            estimatedHeatLoss: 8.9,
            steamConsumption: 1555.2,
            estimatedOilMobility: 6.2,
            expectedProduction: 560.0,
            energyRequirement: 1150.0,
            pipelineStress: 78.4,
            wellIntegrityRisk: 'MEDIUM',
            riskScore: 62.0,
            status: client_1.SimulationStatus.REVIEW,
            reasons: [
                'Predicted reservoir pressure (89.2 bar) approaches formation breakdown threshold (94 bar)',
                'Elevated line thermal stress (78.4%) on SP-02 due to pressure differential',
                'High surface heat loss caused by higher ambient wind velocity',
            ],
            recommendations: [
                'Reduce injection pressure to 85–87 bar to preserve casing integrity',
                'Inspect SP-02 insulation prior to executing any pressure elevation above 88 bar',
                'Conduct stepped pressure falloff test in Digital Twin before physical authorization',
            ],
        },
    });
    // Seed Scenario Comparison
    const scenario = await prisma.scenario.create({
        data: {
            name: 'Cyclic Steam Optimization Comparison - Baghewala R-01',
            description: 'Evaluating trade-offs between conservative, baseline, and aggressive thermal recovery strategies',
        },
    });
    await prisma.scenarioItem.create({
        data: {
            scenarioId: scenario.id,
            simulationId: sim1.id,
            label: 'Scenario A: Baseline 86 bar',
        },
    });
    await prisma.scenarioItem.create({
        data: {
            scenarioId: scenario.id,
            simulationId: sim2.id,
            label: 'Scenario B: Elevated 92 bar',
        },
    });
    // Seed Audit Logs
    await prisma.auditLog.create({
        data: {
            userId: operatorUser.id,
            assetId: iw01.id,
            simulationId: sim1.id,
            action: 'SIMULATION_APPROVED',
            details: 'Simulation #1 approved for prototype operational scenario review. Parameters: 86 bar, 285°C.',
            approvalStatus: 'APPROVED',
            timestamp: new Date(now.getTime() - 1000 * 3600 * 4),
        },
    });
    await prisma.auditLog.create({
        data: {
            userId: engineerUser.id,
            assetId: sp02.id,
            action: 'PARAMETER_SIMULATION',
            details: 'Ran What-If pressure variance on SP-02 to diagnose pressure drop cause.',
            previousValue: '88 bar / 81.2 bar',
            newValue: 'Simulated 85 bar input',
            timestamp: new Date(now.getTime() - 1000 * 3600 * 2),
        },
    });
    await prisma.auditLog.create({
        data: {
            userId: adminUser.id,
            action: 'SYSTEM_CALIBRATION',
            details: 'Recalibrated Baghewala field heat transfer loss coefficient based on updated meteorological weather station telemetry.',
            timestamp: new Date(now.getTime() - 1000 * 3600 * 8),
        },
    });
    // Seed Reports
    await prisma.report.create({
        data: {
            title: 'Baghewala Field Monthly Thermal Efficiency Report',
            type: 'STEAM_EFFICIENCY',
            generatedBy: 'Dr. Sarah Sterling',
            summary: 'Cumulative steam-to-oil ratio (SOR) averaged 2.48 across active producers PW-01, PW-02, and PW-03. OTSG thermal efficiency held at 88.5%.',
            data: {
                totalSteamGeneratedTonnes: 3680,
                totalHeavyOilProducedBbl: 37440,
                averageSOR: 2.48,
                averageHeatLossPct: 6.4,
                operationalAvailabilityPct: 97.2,
            },
            createdAt: new Date(now.getTime() - 1000 * 3600 * 24 * 3),
        },
    });
    console.log('✅ Seeded demo database successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
