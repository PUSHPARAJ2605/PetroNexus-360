import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import { sensorSimulator } from '../sensorSimulator/sensorSimulator';

const prisma = new PrismaClient();

export interface CopilotQueryResponse {
  query: string;
  response: string;
  category: 'PRODUCTION' | 'MAINTENANCE' | 'STEAM' | 'PIPELINE' | 'SIMULATION' | 'PETROLEUM_ENG' | 'GENERAL';
  contextData: {
    relevantAssets?: string[];
    sensorValues?: Record<string, any>;
    activeAlerts?: string[];
    recommendations?: string[];
    source?: 'GEMINI_LLM' | 'DIGITAL_TWIN_DETERMINISTIC';
    model?: string;
  };
  timestamp: string;
}

export interface ChatHistoryItem {
  sender: 'user' | 'copilot';
  text: string;
}

/**
 * Verify if a provided Gemini API Key is active and valid
 */
export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; model?: string; message?: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = [
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-pro-latest',
      'gemini-2.5-flash'
    ];
    
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: 'Hello',
        });
        if (response && response.text) {
          return { valid: true, model: modelName, message: 'Google Gemini API key verified successfully!' };
        }
      } catch (err: any) {
        // Try next model if model not found
        if (err?.message?.includes('not found') || err?.status === 404) {
          continue;
        }
        throw err;
      }
    }
    return { valid: false, message: 'Could not access Gemini models with this key' };
  } catch (error: any) {
    return { valid: false, message: error?.message || 'Invalid Gemini API Key' };
  }
}

/**
 * Main query processor using Google Gemini LLM with Real-Time Digital Twin Context Injection
 * and extensive offline petroleum domain fallback.
 */
export async function processCopilotQuery(
  query: string,
  history?: ChatHistoryItem[],
  customApiKey?: string
): Promise<CopilotQueryResponse> {
  const normalizedQuery = query.toLowerCase().trim();
  const liveState = sensorSimulator.getCurrentState();

  // Fetch recent alerts, maintenance, and simulations for digital twin context
  const activeAlerts = await prisma.alert.findMany({
    where: { status: 'ACTIVE' },
    include: { asset: true },
    take: 5,
  });

  const scheduledMaintenance = await prisma.maintenanceRecord.findMany({
    where: { status: 'SCHEDULED' },
    include: { asset: true },
    take: 5,
  });

  const latestSimulation = await prisma.simulation.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { input: true, result: true, asset: true },
  });

  // Check if any anomaly is actively triggered
  const hasAnomaly = liveState.isAnomalyActive || activeAlerts.length > 0;

  // Check for Gemini API Key
  const activeKey = customApiKey || process.env.GEMINI_API_KEY;

  if (activeKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: activeKey });

      // Compile live telemetry context into system instruction
      const telemetryContext = `
================ CURRENT REAL-TIME DIGITAL TWIN FIELD TELEMETRY ================
Field Name: Baghewala Heavy Oil Basin (Rajasthan Thermal Recovery Unit)
Field Health Score: ${liveState.fieldHealthScore}%
Total Field Oil Production: ${liveState.keyMetrics.oilProductionBpd} BPD (Baseline: 1,325 BPD)
Steam Header Output: ${liveState.keyMetrics.steamPressureBar} bar @ ${liveState.keyMetrics.steamTemperatureC}°C (Rate: ${liveState.keyMetrics.steamRateThr} t/h)
Active Field Alarms (${activeAlerts.length}): ${activeAlerts.length > 0 ? activeAlerts.map(a => `[${a.severity}] ${a.asset.tag}: ${a.message}`).join(' | ') : '0 Active Alarms (All field assets operating within nominal safe parameters)'}

PRODUCER WELLS TELEMETRY:
- PW-01: ${liveState.assets['PW-01']?.telemetry.oilRate || 440} BPD | Water Cut: ${liveState.assets['PW-01']?.telemetry.waterCut || 42}% | Wellhead Temp: ${liveState.assets['PW-01']?.telemetry.wellheadTemp || 98}°C (CSS Cycle 4, Stable)
- PW-02: ${liveState.assets['PW-02']?.telemetry.oilRate || 410} BPD | Water Cut: ${liveState.assets['PW-02']?.telemetry.waterCut || 50}% | Wellhead Temp: ${liveState.assets['PW-02']?.telemetry.wellheadTemp || 92}°C (CSS Cycle 3, Stable)
- PW-03: ${liveState.assets['PW-03']?.telemetry.oilRate || 430} BPD | Water Cut: ${liveState.assets['PW-03']?.telemetry.waterCut || 45}% | Wellhead Temp: ${liveState.assets['PW-03']?.telemetry.wellheadTemp || 95}°C (${hasAnomaly ? 'Monitored under anomaly condition' : 'Normal drawdown, optimal production'})

ARTIFICIAL LIFT PUMP STATIONS:
- SRP-01 (API C-320D-256-120): SPM 8.2 | Vibration: ${liveState.assets['SRP-01']?.telemetry.vibration || 2.1} mm/s | Motor: ${liveState.assets['SRP-01']?.telemetry.motorTemp || 62}°C | Health: 92% (NORMAL)
- SRP-02 (API C-320D-256-120): SPM 7.8 | Vibration: ${liveState.assets['SRP-02']?.telemetry.vibration || 2.4} mm/s | Motor: ${liveState.assets['SRP-02']?.telemetry.motorTemp || 64}°C | Health: 88% (NORMAL)
- SRP-03 (API C-320D-256-120): SPM ${liveState.assets['SRP-03']?.telemetry.strokeRate || 7.6} | Vibration: ${liveState.assets['SRP-03']?.telemetry.vibration || 2.2} mm/s | Motor: ${liveState.assets['SRP-03']?.telemetry.motorTemp || 63.5}°C | Health: ${liveState.assets['SRP-03']?.healthScore || 91}% (${hasAnomaly && (liveState.assets['SRP-03']?.status === 'WARNING' || (liveState.assets['SRP-03']?.telemetry.vibration || 0) > 4.5) ? 'WARNING: High Vibration' : 'NORMAL / OPTIMAL'})

STEAM & PIPELINE INFRASTRUCTURE:
- SG-01 (Industrial Boiler): Burner Firing 84% | Fuel Gas Flow: 280 m3/h | Feedwater: 14.2 m3/h (Normal)
- SP-01 (Steam Header West): Flow: 1.8 t/h | Pressure Drop: 1.2 bar (Normal)
- SP-02 (Steam Header East): Flow: 2.5 t/h | Pressure Drop: ${liveState.assets['SP-02']?.telemetry.heatLoss ? (liveState.assets['SP-02'].telemetry.heatLoss > 6 ? '3.8 bar (Thermal bypass leakage)' : '1.4 bar (Normal)') : '1.4 bar (Normal)'}
- Pipeline Corridors: 3 active pipelines (Oil Gathering, Produced Water, High-Pressure Steam 180°C)

METEOROLOGICAL TELEMETRY:
- Ambient Temperature: ${liveState.weather.temperature}°C | Wind Speed: ${liveState.weather.windSpeed} km/h (NW)
- Thermal Plume Impact: ${liveState.weather.impactLevel} | Relative Humidity: ${liveState.weather.humidity}%
================================================================================
`;

      const systemInstruction = `You are **PetroNexus 360 AI Operations Copilot**, an elite artificial intelligence engineered specifically for the Petroleum & Energy Industry, styled after ChatGPT and Google Gemini.

You have PhD-level petroleum engineering expertise across:
1. **Upstream Exploration & Production (E&P)**: Drilling fluids, casing/tubing design, well completions, well control (IWCF/IADC standards), drillstring dynamics, MWD/LWD, blowout preventers (BOP), and kick tolerance.
2. **Enhanced Oil Recovery (EOR) & Thermodynamics**: Cyclic Steam Stimulation (CSS), Steam-Assisted Gravity Drainage (SAGD), in-situ combustion, CO2/miscible flooding, steam quality enthalpy calculations, Darcy flow in porous media, capillary pressure, and relative permeability.
3. **Artificial Lift & Mechanical Pumping**: Sucker Rod Pumps (API Spec 11E pumping units, polished rod dynamometer card analysis, fluid pound, gas lock, rod parted, unanchored tubing), Electrical Submersible Pumps (ESP), Gas Lift, and Progressive Cavity Pumps (PCP).
4. **Surface Facilities & Flow Assurance**: Multiphase flow regimes (slug, annular, stratified), wax deposition, hydrate formation, emulsions, demulsifiers, 3-phase separators, and gas compressors.
5. **Downstream Refining & Crude Chemistry**: API gravity (${141.5} / SG - 131.5), true boiling point (TBP) distillation, catalytic cracking, hydrotreating, viscosity blending (Refutas/Walther), pour point, and sulfur specification.
6. **Real-Time Field Telemetry & Root Cause Analysis**: Assessing Baghewala field operations using the live telemetry below.

${telemetryContext}

OPERATIONAL GUIDELINES:
- **Tone**: Technical, authoritative, clear, and actionable. Like an expert Senior Petroleum Engineering Specialist.
- **Formatting**: Use rich, readable Markdown with bold headings, clean bullet points, technical tables, and step-by-step engineering workflows.
- **ALERT POLICY**: ${hasAnomaly ? 'There are active field alarms or anomalies reported in the telemetry above. Report and diagnose them accurately.' : 'ALL FIELD ASSETS ARE CURRENTLY IN A HEALTHY, SAFE OPERATIONAL STATE with 0 active alarms. DO NOT fabricate, hallucinate, or report any alarms, vibration issues on SRP-03, or leaks on SP-02 unless the user specifically asks a hypothetical troubleshooting question or asks to simulate an anomaly.'}
- If the question is a general petroleum engineering, chemical, mathematical, or equipment query, provide a comprehensive, educational, deep-dive explanation with formulas and practical field insights.`;

      // Build contents for multi-turn conversation
      const contents: any[] = [];

      // Add recent history if available (up to 6 previous messages)
      if (history && history.length > 0) {
        const recentHistory = history.slice(-6);
        for (const item of recentHistory) {
          contents.push({
            role: item.sender === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          });
        }
      }

      // Add current query
      contents.push({
        role: 'user',
        parts: [{ text: query }],
      });

      // Try models in order of capability
      const modelsToTry = [
        'gemini-flash-latest',
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-pro-latest',
        'gemini-2.5-flash'
      ];
      let generatedText = '';
      let usedModel = 'gemini-flash-latest';

      for (const model of modelsToTry) {
        try {
          const aiResponse = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.35,
              maxOutputTokens: 2048,
            },
          });

          if (aiResponse && aiResponse.text) {
            generatedText = aiResponse.text;
            usedModel = model;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${model} failed, trying fallback:`, err?.message);
        }
      }

      if (generatedText) {
        // Extract recommendations if any bullet points exist
        const recMatches = generatedText.match(/(?:action items?|recommendations?):?\s*([\s\S]*?)(?:\n\n|$)/i);
        const recommendations: string[] = [];
        if (recMatches && recMatches[1]) {
          const lines = recMatches[1].split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()));
          lines.slice(0, 4).forEach(l => recommendations.push(l.replace(/^[-*\d.]\s*/, '').trim()));
        }

        // Categorize based on query keywords
        let category: CopilotQueryResponse['category'] = 'PETROLEUM_ENG';
        if (normalizedQuery.includes('production') || normalizedQuery.includes('bpd') || normalizedQuery.includes('rate')) category = 'PRODUCTION';
        else if (normalizedQuery.includes('pump') || normalizedQuery.includes('srp') || normalizedQuery.includes('vibration') || normalizedQuery.includes('maintenance')) category = 'MAINTENANCE';
        else if (normalizedQuery.includes('steam') || normalizedQuery.includes('css') || normalizedQuery.includes('sagd') || normalizedQuery.includes('thermal')) category = 'STEAM';
        else if (normalizedQuery.includes('pipe') || normalizedQuery.includes('leak') || normalizedQuery.includes('flow')) category = 'PIPELINE';
        else if (normalizedQuery.includes('simulat') || normalizedQuery.includes('what if')) category = 'SIMULATION';

        return {
          query,
          category,
          response: generatedText,
          contextData: {
            relevantAssets: ['PW-01', 'PW-02', 'PW-03', 'SRP-03', 'SG-01'],
            recommendations: recommendations.length > 0 ? recommendations : [
              'Continue monitoring telemetry trends via 3D Digital Twin view',
              'Validate thermal operational boundaries before dispatching field crew',
            ],
            source: 'GEMINI_LLM',
            model: usedModel,
          },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (llmError) {
      console.error('Gemini LLM generation failed, falling back to Petroleum Deterministic Engine:', llmError);
    }
  }

  // ===========================================================================
  // ADVANCED OFFLINE PETROLEUM INTELLIGENCE & DIGITAL TWIN DETERMINISTIC ENGINE
  // ===========================================================================

  // 1. Production inquiries
  if (normalizedQuery.includes('production') || normalizedQuery.includes('decrease') || normalizedQuery.includes('bpd') || normalizedQuery.includes('oil rate') || normalizedQuery.includes('output')) {
    const pw01Rate = liveState.assets['PW-01']?.telemetry.oilRate || 440;
    const pw02Rate = liveState.assets['PW-02']?.telemetry.oilRate || 410;
    const pw03Rate = liveState.assets['PW-03']?.telemetry.oilRate || 430;
    const totalOil = liveState.keyMetrics.oilProductionBpd;

    if (!hasAnomaly) {
      return {
        query,
        category: 'PRODUCTION',
        response: `### Production Telemetry Diagnostic: Baghewala Field

Current gross production is operating normally at **${totalOil} BPD** (Target: **1,325 BPD**, Variance: **-15 BPD** / **-1.1%**). All field assets are operating within nominal parameters with **0 active alarms**.

| Producer Well | Status | Oil Rate (BPD) | Water Cut (%) | Thermal State | Operational Health |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PW-01** | Post-Soak Flow | ${pw01Rate} BPD | 42% | 98°C Wellhead | Optimal drawdown, stable flow |
| **PW-02** | Active CSS Cycle 3 | ${pw02Rate} BPD | 50% | 92°C Wellhead | Steady thermal mobilization |
| **PW-03** | Continuous Lift | ${pw03Rate} BPD | 45% | 95°C Wellhead | Balanced rod pump stroke |

#### Operational Summary:
- **Field Integrity**: Normal. Steam injection and artificial lift systems are fully synchronized.
- **Drawdown Efficiency**: Reservoir pressure maintenance is sustained via continuous cyclic steam cycles.
- **Recommendations**: Continue baseline telemetry monitoring; no corrective action required.`,
        contextData: {
          relevantAssets: ['PW-01', 'PW-02', 'PW-03'],
          sensorValues: { totalOil, pw01Rate, pw02Rate, pw03Rate },
          recommendations: ['Maintain current wellhead choke settings and continuous lift telemetry monitoring'],
          source: 'DIGITAL_TWIN_DETERMINISTIC',
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      query,
      category: 'PRODUCTION',
      response: `### Production Telemetry Diagnostic: Baghewala Field

Current gross production is operating at **${totalOil} BPD** (Baseline Target: **1,325 BPD**, Variance: **-77 BPD** / **-5.8%**).

| Producer Well | Status | Oil Rate (BPD) | Water Cut (%) | Thermal State | Operational Constraint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PW-01** | Post-Soak Flow | ${pw01Rate} BPD | 42% | 98°C Wellhead | Steady depletion, optimal drawdown |
| **PW-02** | Active CSS Cycle 3 | ${pw02Rate} BPD | 51% | 92°C Wellhead | Stable thermal mobilization |
| **PW-03** | Restricted | ${pw03Rate} BPD | 48% | 95°C Wellhead | **Constrained by SRP-03 Gearbox Vibration** |

#### Root Cause Analysis:
1. **PW-03 Pumping Throttling**: Sucker Rod Pump **SRP-03** triggered vibration alarm at **5.8 mm/s** with motor temp climbing to **78°C**. To prevent high-stress fatigue or a catastrophic polished rod parted failure, the drive speed was automatically throttled from **8.4 SPM to 7.5 SPM**. This accounts for **~45 BPD of the total deficit**.
2. **Thermal Heat Front Dispersion**: Cyclic steam thermal falloff in IW-01 indicates post-peak heating, reducing local bitumen mobilization near the drainage radius.

#### Recommended Action Items:
1. Dispatch field technician to perform acoustic lubrication check on SRP-03 gearbox wrist pins.
2. Once gearbox vibration returns to < 4.2 mm/s, ramp SRP-03 back to 8.2 SPM to recover 45 BPD.
3. Review IW-01 steam replenishment schedule in the Operation Simulator.`,
      contextData: {
        relevantAssets: ['PW-01', 'PW-02', 'PW-03', 'SRP-03'],
        sensorValues: { totalOil, pw01Rate, pw02Rate, pw03Rate, srp03Vibration: liveState.assets['SRP-03']?.telemetry.vibration },
        recommendations: [
          'Inspect SRP-03 gearbox bearings and grease packing',
          'Ramp pump speed back to 8.2 SPM post-clearance to recover 45 BPD',
        ],
        source: 'DIGITAL_TWIN_DETERMINISTIC',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // 2. Pump inquiries
  if (normalizedQuery.includes('pump') || normalizedQuery.includes('srp') || normalizedQuery.includes('highest maintenance risk') || normalizedQuery.includes('vibration') || normalizedQuery.includes('gearbox')) {
    const srp03Data = liveState.assets['SRP-03'];

    if (!hasAnomaly) {
      return {
        query,
        category: 'MAINTENANCE',
        response: `### Artificial Lift Pumping Asset Status

All 3 Sucker Rod Pumping units (**SRP-01**, **SRP-02**, **SRP-03**) are running smoothly within nominal operating parameters with **0 active alarms**.

#### Pumping Unit Health Scoreboard:
- **SRP-01**: Health Score **92%** | Vibration: **2.1 mm/s** | Motor Temp: **62°C** | Status: **OPTIMAL**
- **SRP-02**: Health Score **88%** | Vibration: **2.4 mm/s** | Motor Temp: **64°C** | Status: **NORMAL**
- **SRP-03**: Health Score **91%** | Vibration: **2.2 mm/s** | Motor Temp: **63.5°C** | Status: **NORMAL**

#### Mechanical Health Analysis:
- **Vibration Performance**: All beam units remain well below the ISO 10816 alarm threshold of **4.5 mm/s**.
- **Rod String Loading**: Peak polished rod loads and minimum loads are balanced with no indication of fluid pound or gas interference.
- **Motor Drives**: Temperature and electrical current draws are within standard operating bands.`,
        contextData: {
          relevantAssets: ['SRP-01', 'SRP-02', 'SRP-03'],
          sensorValues: { srp01Vib: 2.1, srp02Vib: 2.4, srp03Vib: 2.2 },
          recommendations: ['Routine lubrication check scheduled for next regular maintenance window'],
          source: 'DIGITAL_TWIN_DETERMINISTIC',
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      query,
      category: 'MAINTENANCE',
      response: `### Artificial Lift Pumping Asset Risk Assessment

**SRP-03 (API-11E Walking Beam Unit)** presents elevated operational and mechanical failure risk across the field.

#### Pumping Unit Health Scoreboard:
- **SRP-03**: Health Score **${srp03Data?.healthScore || 68}%** | Status: **CRITICAL WARNING**
- **SRP-02**: Health Score **88%** | Status: **NORMAL**
- **SRP-01**: Health Score **92%** | Status: **OPTIMAL**

#### Critical Telemetry Diagnostics (SRP-03):
- **Gearbox Vibration**: **${srp03Data?.telemetry.vibration || 5.8} mm/s** (ISO 10816 Limit: 4.5 mm/s, Shutdown: 7.0 mm/s)
- **Motor Casing Temp**: **${srp03Data?.telemetry.motorTemp || 78}°C** (18°C above normal baseline)
- **Motor Current Draw**: **${srp03Data?.telemetry.motorCurrent || 29.2} A** (Indicates elevated frictional mechanical resistance)
- **Polished Rod Peak Load**: **19,850 lbs** (API Grade D Sucker Rod Rating: 22,000 lbs)

#### Failure Mode Prediction:
Spectral vibration analysis correlates with **eccentric gearbox pitman wrist-pin bearing spalling**. Continuing unmitigated 24h operation has an **82% probability** of causing premature rod parting or gearbox teeth shear.

#### Recommended Action Items:
1. Work order **#MWO-0419** has been dispatched for Marcus Chen.
2. Carry out laser alignment check on carrier bar and bridle cables.
3. Keep stroke rate capped at $\le 7.5$ SPM until bearing clearance is verified.`,
      contextData: {
        relevantAssets: ['SRP-03', 'SRP-01', 'SRP-02'],
        sensorValues: srp03Data?.telemetry,
        recommendations: [
          'Inspect wrist pin bearings and polished rod packing',
          'Keep SPM capped at 7.5 to prevent fatigue rod parting',
        ],
        source: 'DIGITAL_TWIN_DETERMINISTIC',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // 3. Steam inquiries
  if (normalizedQuery.includes('steam loss') || normalizedQuery.includes('steam quality') || normalizedQuery.includes('boiler') || normalizedQuery.includes('sg-01') || normalizedQuery.includes('heat loss')) {
    if (!hasAnomaly) {
      return {
        query,
        category: 'STEAM',
        response: `### Steam Generation & Thermal Enthalpy Status

Thermal energy efficiency across the steam distribution grid is currently operating at **88.5%** (Benchmark target: $\ge 88.0\%$) with **0 active alarms**.

#### Thermal Distribution Summary:
- **Steam Generator SG-01**: Generating **${liveState.keyMetrics.steamRateThr} t/h** of superheated saturated steam at **${liveState.keyMetrics.steamPressureBar} bar** and **${liveState.keyMetrics.steamTemperatureC}°C** (Burner Efficiency: 88.5%).
- **Estimated Steam Quality**: ~82% saturated vapor at wellhead.
- **Pipelines**: Both steam headers (SP-01 and SP-02) are maintaining nominal thermal retention with insulation blankets intact.`,
        contextData: {
          relevantAssets: ['SG-01', 'SP-01', 'SP-02'],
          sensorValues: {
            steamPressure: liveState.keyMetrics.steamPressureBar,
            steamTemp: liveState.keyMetrics.steamTemperatureC,
            steamRate: liveState.keyMetrics.steamRateThr,
          },
          recommendations: ['Maintain standard feedwater chemistry checks'],
          source: 'DIGITAL_TWIN_DETERMINISTIC',
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      query,
      category: 'STEAM',
      response: `### Steam Generation & Thermal Enthalpy Loss Analysis

Thermal energy efficiency across the steam distribution grid is currently at **79.4%** (Benchmark target: $\ge 88.0\%$).

#### Thermal Distribution Audit:
- **Steam Generator SG-01**: Generating **${liveState.keyMetrics.steamRateThr} t/h** of superheated saturated steam at **${liveState.keyMetrics.steamPressureBar} bar** and **${liveState.keyMetrics.steamTemperatureC}°C** (Burner Efficiency: 84.2%).
- **Estimated Steam Quality**: ~82% saturated vapor at wellhead.

#### Root Causes of Enthalpy Dissipation:
1. **Pipeline Segment SP-02 Valve Packing Leak**: Surface infrared sensors detect localized thermal dissipation of **$\Delta T = 42^\circ\\text{C}$** on bypass branch SP-02, causing approximately **180 kg/h** steam condensation loss.
2. **Ambient Wind Convective Cooling**: Strong NW wind currents (${liveState.weather.windSpeed} km/h) are increasing convective heat transfer losses across above-ground uninsulated flange connections.

#### Recommended Action Items:
1. Inspect flange insulation blankets on Steam Corridor SP-02.
2. Recalibrate thermodynamic steam trap ST-04 to prevent wet steam blow-through.
3. Slightly increase boiler feedwater preheat temperature from 65°C to 82°C.`,
      contextData: {
        relevantAssets: ['SG-01', 'SP-01', 'SP-02'],
        sensorValues: {
          steamPressure: liveState.keyMetrics.steamPressureBar,
          steamTemp: liveState.keyMetrics.steamTemperatureC,
          steamRate: liveState.keyMetrics.steamRateThr,
        },
        recommendations: [
          'Replace thermal insulation jacket on pipeline SP-02',
          'Audit steam trap ST-04 condensate discharge',
        ],
        source: 'DIGITAL_TWIN_DETERMINISTIC',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // 4. Pipeline inquiries
  if (normalizedQuery.includes('sp-02') || normalizedQuery.includes('pipeline') || normalizedQuery.includes('leak') || normalizedQuery.includes('pressure drop')) {
    if (!hasAnomaly) {
      return {
        query,
        category: 'PIPELINE',
        response: `### Pipeline Grid Operational Status: High-Pressure Corridors

All active pipeline corridors (Oil Gathering, Produced Water, High-Pressure Steam) are operating nominally with **0 active alarms**.

#### Telemetry Status:
- **SP-01 (West Steam Trunk)**: Inlet: 88.0 bar | Outlet: 86.1 bar | $\Delta P$: 1.9 bar (Normal)
- **SP-02 (East Steam Trunk)**: Inlet: 88.0 bar | Outlet: 86.4 bar | $\Delta P$: 1.6 bar (Normal)
- **OP-01 (Oil Gathering Line)**: Inlet: 34.0 bar | Outlet: 28.5 bar | Flow: 52 m³/h (Normal)

#### Integrity Verification:
- Acoustic sensors and distributed temperature sensing (DTS) indicate zero bypass leakage or thermal bridging.
- All expansion loops and flange insulation jackets are within ASME B31.3 structural limits.`,
        contextData: {
          relevantAssets: ['SP-01', 'SP-02', 'OP-01'],
          recommendations: ['Routine pigging inspection on schedule for next cycle'],
          source: 'DIGITAL_TWIN_DETERMINISTIC',
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      query,
      category: 'PIPELINE',
      response: `### Telemetry Incident Report: High-Pressure Steam Corridor SP-02

A **WARNING Alert** is active on Pipeline Segment **SP-02** (Steam Distribution Trunk East).

#### Telemetry Symptoms:
- **Inlet Pressure**: 86.2 bar
- **Outlet Pressure**: 82.4 bar
- **Differential Pressure ($\Delta P$)**: **3.8 bar** (Normal operational limit: $\le 1.8\\text{ bar}$)
- **Skin Temperature**: 144°C (Normal insulated skin ceiling: 65°C)

#### Diagnostic Findings:
The elevated differential pressure combined with elevated skin temperature indicates an **internal steam bypass and insulation degradation** near expansion loop EL-02. Saturated steam is condensing prematurely, resulting in two-phase slug flow and acoustic cavitation.

#### Operational Mitigation:
1. Divert 35% of the steam flow to parallel header SP-01 to relieve stress on SP-02.
2. Mobilize ultrasonic leak detection team to inspect expansion joint bellows.
3. Do not exceed 88 bar line pressure until bypass valve seating is verified.`,
      contextData: {
        relevantAssets: ['SP-02', 'SP-01'],
        recommendations: [
          'Divert 35% steam flow to header SP-01',
          'Inspect expansion joint bellows with ultrasonic acoustic detector',
        ],
        source: 'DIGITAL_TWIN_DETERMINISTIC',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // 5. Petroleum Engineering Conceptual Knowledge (SAGD vs CSS, API Gravity, Sucker Rod Dynamics)
  if (normalizedQuery.includes('sagd') || normalizedQuery.includes('css') || normalizedQuery.includes('thermal recovery') || normalizedQuery.includes('cyclic steam')) {
    return {
      query,
      category: 'PETROLEUM_ENG',
      response: `### Petroleum Engineering Technical Brief: CSS vs. SAGD

In heavy oil and bitumen reservoirs (such as the Baghewala Basin, API 10–14°), thermal recovery is mandatory to decrease kinematic viscosity by up to **4 orders of magnitude**.

#### 1. Cyclic Steam Stimulation (CSS) — *The "Huff and Puff" Method*
- **Mechanism**: Single-well cyclic process carried out in three distinct phases:
  1. **Injection (Huff)**: Superheated steam (80–100 bar, 280–310°C, 80% quality) is injected into the formation for 10–20 days.
  2. **Soaking**: The well is shut in for 3–7 days to allow conduction and latent heat transfer to soften the bitumen matrix.
  3. **Production (Puff)**: The well is placed on artificial lift (Sucker Rod Pump) to extract mobilized oil until temperature declines.
- **Best Suited For**: Geologically heterogeneous reservoirs, moderate pay thickness (8–15 m), or formations with natural shale barriers.

#### 2. Steam-Assisted Gravity Drainage (SAGD)
- **Mechanism**: Dual parallel horizontal well pair separated vertically by ~5 meters.
  - The upper well continuously injects steam, creating an expanding **Steam Chest**.
  - Heated, melted bitumen drains by gravity along the steam chamber edge into the lower production well.
- **Best Suited For**: Thick, continuous sandstone pay zones (> 15 m) with high vertical permeability ($k_v / k_h > 0.6$) and no extensive shale baffles.

#### Baghewala Field Context:
Baghewala utilizes **CSS (Cycle 3–5)** because the reservoir features interbedded siltstone stringers, where cyclic pressurization helps micro-fracture the near-wellbore formation for enhanced drainage.`,
      contextData: {
        relevantAssets: ['IW-01', 'PW-01', 'PW-02', 'PW-03'],
        recommendations: [
          'Model SAGD horizontal lateral conversion in Operation Simulator for Zone B',
        ],
        source: 'DIGITAL_TWIN_DETERMINISTIC',
      },
      timestamp: new Date().toISOString(),
    };
  }

  if (normalizedQuery.includes('api gravity') || normalizedQuery.includes('viscosity') || normalizedQuery.includes('bitumen') || normalizedQuery.includes('heavy oil')) {
    return {
      query,
      category: 'PETROLEUM_ENG',
      response: `### Petroleum Fundamentals: API Gravity & Crude Oil Classification

**API Gravity** (American Petroleum Institute gravity) is the global standard measure of how heavy or light a petroleum liquid is compared to water.

$$\\text{API Gravity} = \\frac{141.5}{\\text{Specific Gravity at } 60^\\circ\\text{F}} - 131.5$$

#### Crude Oil Classification Spectrum:
| Crude Type | API Gravity | Specific Gravity | Viscosity (cP) | Typical Recovery Method |
| :--- | :--- | :--- | :--- | :--- |
| **Light Crude** | $> 31.1^\\circ$ | $< 0.870$ | $1 - 10$ | Natural flow, waterflood |
| **Medium Crude** | $22.3^\\circ - 31.1^\\circ$ | $0.870 - 0.920$ | $10 - 100$ | Artificial lift (Beam pump, ESP) |
| **Heavy Crude** | $10.0^\\circ - 22.3^\\circ$ | $0.920 - 1.000$ | $100 - 10,000$ | Thermal EOR (CSS, Steam flood) |
| **Extra Heavy / Bitumen** | $< 10.0^\\circ$ | $> 1.000$ | $> 10,000$ (Semi-solid) | SAGD, Mining, Diluent blending |

#### Reservoir Thermodynamics:
At ambient Baghewala reservoir temperature (34°C), heavy crude oil has a viscosity of **~1,850 cP** (similar to cold molasses). When heated by CSS steam injection to **180°C**, viscosity plummets to **~18 cP**, enabling commercial extraction via API-11E beam pumping units.`,
      contextData: {
        recommendations: ['Monitor wellhead viscosity meters to optimize diluent injection'],
        source: 'DIGITAL_TWIN_DETERMINISTIC',
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Default intelligent assistant response referencing real-time context
  return {
    query,
    category: 'GENERAL',
    response: `### PetroNexus 360 AI Operations Copilot Active

I am connected to the **Baghewala Heavy Oil Basin** real-time Digital Twin telemetry stream:

- **Field Health**: **${liveState.fieldHealthScore}%** | Status: **MONITORED**
- **Active Oil Production**: **${liveState.keyMetrics.oilProductionBpd} BPD**
- **Steam Header Injection**: **${liveState.keyMetrics.steamPressureBar} bar** @ **${liveState.keyMetrics.steamTemperatureC}°C** (Flow Rate: ${liveState.keyMetrics.steamRateThr} t/h)
- **Pumping Units**: SRP-01 (Normal), SRP-02 (Normal), SRP-03 (Warning: 5.8 mm/s vibration)
- **Active Pipeline Network**: 3 primary corridors, SP-02 bypass inspection queued
- **Meteorological Context**: Ambient ${liveState.weather.temperature}°C, Wind ${liveState.weather.windSpeed} km/h (NW)

#### Suggested Petroleum & Operational Questions:
- *"Why did production decrease today?"*
- *"Which pump currently has the highest maintenance risk?"*
- *"What is causing high steam loss on SP-02?"*
- *"Explain SAGD vs CSS for heavy oil (API < 14°)"*
- *"What are the blowout prevention procedures for sour gas?"*
- *"What happens if steam pressure is increased to 92 bar?"*

💡 *Tip: Connect your **Google Gemini API Key** in the Copilot Settings above to unlock open-ended conversational reasoning across all global petroleum literature!*`,
    contextData: {
      relevantAssets: ['SG-01', 'SP-01', 'SP-02', 'PW-01', 'SRP-03'],
      recommendations: [
        'Run Digital Twin Operation Simulator prior to any wellhead valve adjustments',
      ],
      source: 'DIGITAL_TWIN_DETERMINISTIC',
    },
    timestamp: new Date().toISOString(),
  };
}
