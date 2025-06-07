import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import { log } from "./vite";

/**
 * Server Routes Configuration
 * 
 * This module sets up the Express server routes and Flask backend proxy.
 * It manages the communication between the frontend and the Flask backend,
 * handling all API requests and responses.
 * 
 * Key Features:
 * - Flask backend process management
 * - API request proxying
 * - Error handling and logging
 * - Authentication header forwarding
 */

/**
 * Registers routes and initializes the server
 * @param {Express} app - Express application instance
 * @returns {Promise<Server>} HTTP server instance
 */
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
          'Accept': 'application/json',
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
        }
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        requestOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(flaskUrl, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`Flask error response: ${response.status} - ${errorText}`, "error");
        try {
          const errorJson = JSON.parse(errorText);
          return res.status(response.status).json(errorJson);
        } catch {
          return res.status(response.status).json({ 
            error: 'Flask backend error',
            details: errorText
          });
        }
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

/**
 * Starts the Flask backend process
 * Configures environment and handles process output
 * @param {string} pythonPath - Path to Python executable
 * @param {string} scriptPath - Path to Flask entry script
 */

/**
 * Proxy middleware for Flask backend requests
 * Handles request forwarding, error handling, and response processing
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
