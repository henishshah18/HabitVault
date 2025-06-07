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
  app.use('/api', async (req, res) => {
    try {
      const flaskUrl = `http://localhost:5001${req.originalUrl}`;
      log(`Proxying ${req.method} ${req.originalUrl} to ${flaskUrl}`);
      
      const requestOptions: RequestInit = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        requestOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(flaskUrl, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`Flask error response: ${response.status} - ${errorText}`, "error");
        return res.status(response.status).json({ 
          error: 'Flask backend error',
          details: errorText
        });
      }

      // Handle empty responses (like OPTIONS requests)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        res.status(response.status).json(data);
      } else {
        // For OPTIONS or empty responses, just return status
        res.status(response.status).end();
      }
    } catch (err: any) {
      log(`Proxy error: ${err.message}`, "error");
      res.status(503).json({ 
        error: 'Flask backend unavailable',
        message: `Connection failed: ${err.message}`
      });
    }
  });

  // Cleanup on exit
  process.on('SIGINT', () => flaskProcess.kill());
  process.on('SIGTERM', () => flaskProcess.kill());

  return httpServer;
}
