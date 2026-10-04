import { Request, Response } from 'express';
import { sensorSimulator } from '../services/sensorSimulator/sensorSimulator';
import { calculateWeatherImpact } from '../services/digitalTwin/weatherImpact';

export async function getCurrentWeather(req: Request, res: Response): Promise<void> {
  try {
    const liveTelemetry = sensorSimulator.getCurrentState();
    const weather = liveTelemetry.weather;

    const impact = calculateWeatherImpact({
      ambientTemperature: weather.temperature,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      rainfall: weather.rainfall,
    });

    res.json({
      location: 'Baghewala Field Weather Station AWS-01',
      coordinates: '27.95° N, 72.85° E (Thar Desert Basin)',
      current: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        rainfall: weather.rainfall,
        pressure: 1008.4,
        heatIndex: parseFloat((weather.temperature + 2.5).toFixed(1)),
        condition: 'Clear / Arid High Thermal Gradient',
      },
      steamImpact: {
        impactLevel: impact.impactLevel,
        surfaceHeatLossPct: impact.surfaceHeatLossPct,
        convectiveFactor: impact.convectiveLossFactor,
        summary: impact.weatherSummary,
        recommendation: impact.recommendedAdjustment,
      },
      timestamp: liveTelemetry.timestamp,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve current weather' });
  }
}

export async function getWeatherForecast(req: Request, res: Response): Promise<void> {
  try {
    const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const forecast = days.map((day, idx) => {
      const temp = 33.5 + Math.sin(idx) * 3.5;
      const wind = 18.0 + Math.cos(idx * 1.2) * 8.0;
      const humidity = 35 + Math.sin(idx * 0.8) * 10;
      const heatLoss = parseFloat((4.5 + (wind - 12) * 0.16).toFixed(1));

      return {
        day,
        temperature: parseFloat(temp.toFixed(1)),
        windSpeed: parseFloat(wind.toFixed(1)),
        humidity: Math.round(humidity),
        rainfall: idx === 4 ? 1.2 : 0.0,
        impactLevel: heatLoss > 7.0 ? 'HIGH' : heatLoss > 5.2 ? 'MODERATE' : 'LOW',
        estimatedHeatLossPct: heatLoss,
        condition: idx === 4 ? 'Passing Rain Showers' : wind > 25 ? 'High Wind Dust' : 'Sunny / Clear',
      };
    });

    // Ambient Temp vs Estimated Steam Heat Loss curve (for Recharts)
    const heatLossCurve = [];
    for (let t = 10; t <= 45; t += 5) {
      // At lower ambient temp, temperature differential is larger, so heat loss increases
      const lossAtLowWind = parseFloat((3.2 + ((280 - t) / 250) * 2.2).toFixed(2));
      const lossAtMedWind = parseFloat((lossAtLowWind * 1.28).toFixed(2));
      const lossAtHighWind = parseFloat((lossAtLowWind * 1.62).toFixed(2));

      heatLossCurve.push({
        ambientTemp: `${t}°C`,
        tempNum: t,
        lossLowWind: lossAtLowWind,   // 10 km/h
        lossMedWind: lossAtMedWind,   // 25 km/h
        lossHighWind: lossAtHighWind, // 40 km/h
      });
    }

    res.json({
      forecast,
      heatLossCurve,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve weather forecast' });
  }
}
