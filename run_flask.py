#!/usr/bin/env python3
"""
Flask application runner
This script starts the Flask backend server on port 5001
"""
import os
import sys
from backend.app import create_app

if __name__ == '__main__':
    # Create Flask app
    app = create_app()
    
    # Get port from environment or use 5001
    port = int(os.environ.get('FLASK_PORT', 5001))
    
    # Run the application
    print(f"Starting Flask backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)