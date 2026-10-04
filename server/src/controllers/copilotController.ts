import { Request, Response } from 'express';
import { processCopilotQuery, verifyApiKey } from '../services/copilot/copilotService';

export async function queryCopilot(req: Request, res: Response): Promise<void> {
  try {
    const { query, conversationHistory, apiKey } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query prompt is required' });
      return;
    }

    // Header fallback
    const key = apiKey || (req.headers['x-gemini-api-key'] as string) || process.env.GEMINI_API_KEY;

    const result = await processCopilotQuery(query, conversationHistory, key);
    res.json(result);
  } catch (error: any) {
    console.error('Copilot processing error:', error);
    res.status(500).json({ error: 'AI Operations Copilot failed to process query' });
  }
}

export async function verifyCopilotKey(req: Request, res: Response): Promise<void> {
  try {
    const { apiKey } = req.body;
    const key = apiKey || (req.headers['x-gemini-api-key'] as string) || process.env.GEMINI_API_KEY;
    if (!key) {
      res.status(400).json({ valid: false, message: 'No API key provided' });
      return;
    }

    const result = await verifyApiKey(key);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ valid: false, message: error?.message || 'Verification failed' });
  }
}
