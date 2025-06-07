#!/usr/bin/env python3
"""
Flask application runner
This script starts the Flask backend server on port 5000
"""
import os
import sys
from backend.app import create_app

if __name__ == '__main__':
    # Create Flask app
    app = create_app()
    
    # Run the application
    print("Starting Flask backend on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)