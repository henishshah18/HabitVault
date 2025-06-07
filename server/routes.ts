import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Start Flask backend process
  const flaskProcess = spawn('python3', ['run_flask.py'], {
    cwd: process.cwd(),
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { 
      ...process.env,
      FLASK_PORT: '5001'
    }
  });

  flaskProcess.stdout?.on('data', (data) => {
    log(`Flask: ${data.toString().trim()}`);
  });

  flaskProcess.stderr?.on('data', (data) => {
    log(`Flask Error: ${data.toString().trim()}`, "error");
  });

  // Wait for Flask to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Proxy API requests to Flask backend
  app.use('/api/*', async (req, res) => {
    try {
      const flaskUrl = `http://localhost:5001${req.path}`;
      
      const response = await fetch(flaskUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      log(`Flask backend error: ${err.message}`, "error");
      res.status(503).json({ 
        error: 'Flask backend unavailable',
        message: 'Please ensure Flask is running on port 5001'
      });
    }
  });

  // Cleanup on exit
  process.on('SIGINT', () => flaskProcess.kill());
  process.on('SIGTERM', () => flaskProcess.kill());

  return httpServer;
}
