from flask import Flask, jsonify, request
from flask_cors import CORS
from backend.models import db, User
from backend.config import Config
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Routes
    @app.route('/api/hello', methods=['GET'])
    def hello():
        """Return a hello message from Flask backend"""
        return jsonify({
            'message': 'Hello from Flask!',
            'status': 'success',
            'backend': 'Flask',
            'database': 'PostgreSQL + SQLAlchemy',
            'timestamp': db.func.current_timestamp()
        })
    
    @app.route('/api/status', methods=['GET'])
    def status():
        """Return backend status information"""
        try:
            # Test database connection
            db.session.execute(db.text('SELECT 1'))
            db_status = 'connected'
        except Exception as e:
            db_status = 'disconnected'
            
        return jsonify({
            'backend': {
                'framework': 'Flask',
                'status': 'running',
                'port': 5000,
                'cors': 'enabled'
            },
            'database': {
                'type': 'PostgreSQL',
                'orm': 'SQLAlchemy',
                'status': db_status
            },
            'api': {
                'version': '1.0',
                'endpoints': ['/api/hello', '/api/status', '/api/users']
            }
        })
    
    @app.route('/api/users', methods=['GET'])
    def get_users():
        """Get all users"""
        try:
            users = User.query.all()
            return jsonify({
                'users': [user.to_dict() for user in users],
                'count': len(users)
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/users', methods=['POST'])
    def create_user():
        """Create a new user"""
        try:
            data = request.get_json()
            
            if not data or 'username' not in data or 'email' not in data:
                return jsonify({'error': 'Username and email are required'}), 400
            
            # Check if user already exists
            existing_user = User.query.filter(
                (User.username == data['username']) | 
                (User.email == data['email'])
            ).first()
            
            if existing_user:
                return jsonify({'error': 'User with this username or email already exists'}), 409
            
            user = User(
                username=data['username'],
                email=data['email']
            )
            
            db.session.add(user)
            db.session.commit()
            
            return jsonify({
                'message': 'User created successfully',
                'user': user.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
