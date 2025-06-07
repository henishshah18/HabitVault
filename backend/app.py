from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from backend.models import db, User, Habit, HabitCompletion
from backend.config import Config
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, date, datetime
import os

def initialize_database():
    """Initialize database and create test user and sample habits if not exists"""
    try:
        # Check if test user exists
        test_user = User.query.filter_by(email='test@example.com').first()
        if not test_user:
            # Create test user with hashed password
            password_hash = generate_password_hash('password')
            test_user = User(email='test@example.com', password_hash=password_hash)
            db.session.add(test_user)
            db.session.commit()
            print("Test user created successfully")
        else:
            print("Test user already exists")
        
        # Check if test user has any habits, if not create sample habits
        user_habits = Habit.query.filter_by(user_id=test_user.id).first()
        if not user_habits:
            sample_habits = [
                Habit(
                    user_id=test_user.id,
                    name='Drink 2L water daily',
                    target_days='every_day',
                    start_date=date(2025, 5, 1)
                ),
                Habit(
                    user_id=test_user.id,
                    name='Read for 30 minutes',
                    target_days='every_day',
                    start_date=date(2025, 5, 10)
                ),
                Habit(
                    user_id=test_user.id,
                    name='Exercise for 1 hour',
                    target_days='weekdays',
                    start_date=date(2025, 5, 15)
                )
            ]
            
            for habit in sample_habits:
                db.session.add(habit)
            
            db.session.commit()
            print("Sample habits created for test user")
        else:
            print("Test user already has habits")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.session.rollback()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=['http://localhost:5000', 'http://localhost:3000'], 
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization', 'Accept'],
         supports_credentials=True)
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Initialize database and create tables
    with app.app_context():
        db.create_all()
        initialize_database()
    
    # Routes
    @app.route('/api/hello', methods=['GET'])
    def hello():
        """Return a hello message from Flask backend"""
        from datetime import datetime
        return jsonify({
            'message': 'Hello from Flask!',
            'status': 'success',
            'backend': 'Flask',
            'database': 'PostgreSQL + SQLAlchemy',
            'timestamp': datetime.now().isoformat()
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
                'endpoints': ['/api/hello', '/api/status', '/api/users', '/api/register', '/api/login', '/api/protected', '/api/habits']
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
    
    @app.route('/api/register', methods=['POST'])
    def register():
        """Register a new user"""
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data:
                return jsonify({'error': 'Request body is required'}), 400
            
            if 'email' not in data or not data['email']:
                return jsonify({'error': 'Email is required'}), 400
                
            if 'password' not in data or not data['password']:
                return jsonify({'error': 'Password is required'}), 400
            
            email = data['email'].strip().lower()
            password = data['password']
            
            # Basic email validation
            if '@' not in email or '.' not in email:
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if user already exists
            existing_user = User.query.filter_by(email=email).first()
            
            if existing_user:
                return jsonify({'error': 'User with this email already exists'}), 409
            
            # Hash the password
            password_hash = generate_password_hash(password)
            user = User(email=email, password_hash=password_hash)
            
            db.session.add(user)
            db.session.commit()
            
            return jsonify({
                'message': 'User registered successfully',
                'user': user.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Registration failed: {str(e)}'}), 500

    @app.route('/api/login', methods=['POST'])
    def login():
        """Login a user and return JWT token"""
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data:
                return jsonify({'error': 'Request body is required'}), 400
            
            if 'email' not in data or not data['email']:
                return jsonify({'error': 'Email is required'}), 400
                
            if 'password' not in data or not data['password']:
                return jsonify({'error': 'Password is required'}), 400
            
            email = data['email'].strip().lower()
            password = data['password']
            
            # Find user by email
            user = User.query.filter_by(email=email).first()
            
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Verify password
            if not check_password_hash(user.password_hash, password):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Create JWT token
            access_token = create_access_token(identity=str(user.id))
            
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user_id': user.id,
                'user': user.to_dict()
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Login failed: {str(e)}'}), 500

    @app.route('/api/protected', methods=['GET'])
    @jwt_required()
    def protected():
        """Protected endpoint that requires JWT token"""
        try:
            current_user_id = int(get_jwt_identity())
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({
                'message': 'Access granted to protected endpoint',
                'user_id': current_user_id,
                'user': user.to_dict(),
                'authenticated': True
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Protected endpoint error: {str(e)}'}), 500

    # Habit Management Endpoints
    @app.route('/api/habits', methods=['POST'])
    @jwt_required()
    def create_habit():
        """Create a new habit for the authenticated user"""
        try:
            current_user_id = int(get_jwt_identity())
            data = request.get_json()
            
            # Validate required fields
            if not data:
                return jsonify({'error': 'Request body is required'}), 400
            
            if 'name' not in data or not data['name']:
                return jsonify({'error': 'Habit name is required'}), 400
                
            if 'target_days' not in data or not data['target_days']:
                return jsonify({'error': 'Target days is required'}), 400
                
            if 'start_date' not in data or not data['start_date']:
                return jsonify({'error': 'Start date is required'}), 400
            
            # Validate target_days (allow custom comma-separated days)
            valid_target_days = ['every_day', 'weekdays', 'custom']
            target_days = data['target_days']
            
            # Check if it's a valid predefined option or comma-separated custom days
            if target_days not in valid_target_days and ',' not in target_days:
                return jsonify({'error': f'Target days must be one of: {", ".join(valid_target_days)} or comma-separated days'}), 400
            
            # Parse start_date
            try:
                start_date = date.fromisoformat(data['start_date'])
            except ValueError:
                return jsonify({'error': 'Invalid start date format. Use YYYY-MM-DD'}), 400
            
            # Create new habit
            habit = Habit(
                user_id=current_user_id,
                name=data['name'].strip(),
                target_days=target_days,
                start_date=start_date
            )
            
            db.session.add(habit)
            db.session.commit()
            
            return jsonify({
                'message': 'Habit created successfully',
                'habit': habit.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to create habit: {str(e)}'}), 500

    @app.route('/api/habits', methods=['GET'])
    @jwt_required()
    def get_habits():
        """Get all habits for the authenticated user"""
        try:
            current_user_id = int(get_jwt_identity())
            
            habits = Habit.query.filter_by(user_id=current_user_id).all()
            
            return jsonify({
                'habits': [habit.to_dict() for habit in habits],
                'count': len(habits)
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to fetch habits: {str(e)}'}), 500

    @app.route('/api/habits/<int:habit_id>', methods=['PUT'])
    @jwt_required()
    def update_habit(habit_id):
        """Update an existing habit by ID for the authenticated user"""
        try:
            current_user_id = int(get_jwt_identity())
            data = request.get_json()
            
            # Find habit belonging to current user
            habit = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first()
            
            if not habit:
                return jsonify({'error': 'Habit not found or access denied'}), 404
            
            if not data:
                return jsonify({'error': 'Request body is required'}), 400
            
            # Update fields if provided
            if 'name' in data:
                if not data['name']:
                    return jsonify({'error': 'Habit name cannot be empty'}), 400
                habit.name = data['name'].strip()
            
            if 'target_days' in data:
                valid_target_days = ['every_day', 'weekdays', 'custom']
                if data['target_days'] not in valid_target_days:
                    return jsonify({'error': f'Target days must be one of: {", ".join(valid_target_days)}'}), 400
                habit.target_days = data['target_days']
            
            if 'start_date' in data:
                try:
                    habit.start_date = date.fromisoformat(data['start_date'])
                except ValueError:
                    return jsonify({'error': 'Invalid start date format. Use YYYY-MM-DD'}), 400
            
            db.session.commit()
            
            return jsonify({
                'message': 'Habit updated successfully',
                'habit': habit.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to update habit: {str(e)}'}), 500

    @app.route('/api/habits/<int:habit_id>', methods=['DELETE'])
    @jwt_required()
    def delete_habit(habit_id):
        """Delete a habit by ID for the authenticated user"""
        try:
            current_user_id = int(get_jwt_identity())
            
            # Find habit belonging to current user
            habit = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first()
            
            if not habit:
                return jsonify({'error': 'Habit not found or access denied'}), 404
            
            db.session.delete(habit)
            db.session.commit()
            
            return jsonify({
                'message': 'Habit deleted successfully',
                'deleted_habit_id': habit_id
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to delete habit: {str(e)}'}), 500

    @app.route('/api/habits/<int:habit_id>/complete', methods=['POST'])
    @jwt_required()
    def complete_habit(habit_id):
        """Mark a habit as completed for today"""
        try:
            current_user_id = int(get_jwt_identity())
            
            # Find habit belonging to current user
            habit = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first()
            
            if not habit:
                return jsonify({'error': 'Habit not found or access denied'}), 404
            
            # Check if already completed today
            today = date.today()
            existing_completion = HabitCompletion.query.filter_by(
                habit_id=habit_id,
                completion_date=today
            ).first()
            
            if existing_completion:
                return jsonify({'error': 'Habit already completed today'}), 409
            
            # Create completion record
            completion = HabitCompletion(habit_id=habit_id, completion_date=today)
            db.session.add(completion)
            
            # Update streaks
            habit.current_streak += 1
            if habit.current_streak > habit.longest_streak:
                habit.longest_streak = habit.current_streak
            
            # Check for perfect day and update user's perfect days counter
            user = User.query.get(current_user_id)
            all_completed = False
            habits_due_today = []
            
            if user:
                # Get all habits due today for this user
                user_habits = Habit.query.filter_by(user_id=current_user_id).all()
                habits_due_today = [h for h in user_habits if h.is_due_today()]
                
                # Check if all habits due today are now completed
                all_completed = True
                for due_habit in habits_due_today:
                    habit_completed = HabitCompletion.query.filter_by(
                        habit_id=due_habit.id,
                        completion_date=today
                    ).first()
                    if not habit_completed:
                        all_completed = False
                        break
                
                # If perfect day achieved and we have habits due today
                today_str = today.isoformat()
                if all_completed and len(habits_due_today) > 0:
                    # Add today to perfect days if not already there
                    if not user.has_perfect_day(today_str):
                        user.add_perfect_day(today_str)
                else:
                    # Remove today from perfect days if it was there but no longer complete
                    if user.has_perfect_day(today_str):
                        user.remove_perfect_day(today_str)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Habit completed successfully',
                'habit': habit.to_dict(),
                'completion': completion.to_dict(),
                'perfect_day_achieved': all_completed and len(habits_due_today) > 0
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to complete habit: {str(e)}'}), 500

    @app.route('/api/habits/<int:habit_id>/uncomplete', methods=['POST'])
    @jwt_required()
    def uncomplete_habit(habit_id):
        """Unmark a habit as completed for today"""
        try:
            current_user_id = int(get_jwt_identity())
            
            # Find habit belonging to current user
            habit = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first()
            
            if not habit:
                return jsonify({'error': 'Habit not found or access denied'}), 404
            
            # Find today's completion
            today = date.today()
            completion = HabitCompletion.query.filter_by(
                habit_id=habit_id,
                completion_date=today
            ).first()
            
            if not completion:
                return jsonify({'error': 'Habit not completed today'}), 404
            
            # Remove completion record
            db.session.delete(completion)
            
            # Reset current streak (simple approach - can be enhanced)
            habit.current_streak = max(0, habit.current_streak - 1)
            
            # Check if this affects perfect day status
            user = User.query.get(current_user_id)
            if user:
                today_str = today.isoformat()
                # Remove today from perfect days since a habit is now incomplete
                if user.has_perfect_day(today_str):
                    user.remove_perfect_day(today_str)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Habit uncompleted successfully',
                'habit': habit.to_dict()
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to uncomplete habit: {str(e)}'}), 500

    @app.route('/api/habits/<int:habit_id>/history', methods=['GET'])
    @jwt_required()
    def get_habit_history(habit_id):
        """Get habit completion history for calendar/heatmap view"""
        try:
            current_user_id = int(get_jwt_identity())
            
            # Verify habit belongs to user
            habit = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first()
            if not habit:
                return jsonify({'error': 'Habit not found or access denied'}), 404
            
            # Get optional date range parameters
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            
            # Default to last 30 days if no range provided
            if not start_date_str or not end_date_str:
                end_date = date.today()
                start_date = end_date - timedelta(days=30)
            else:
                try:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
            
            # Get all completions for the habit in the date range
            completions = HabitCompletion.query.filter(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.completion_date >= start_date,
                HabitCompletion.completion_date <= end_date
            ).all()
            
            # Create a set of completed dates for quick lookup
            completed_dates = {completion.completion_date for completion in completions}
            
            # Generate daily status for each date in range
            history = []
            current_date = start_date
            
            while current_date <= end_date:
                # Determine status for this date
                if current_date in completed_dates:
                    status = 'completed'
                elif current_date < date.today():
                    # Check if habit was due on this date based on target_days
                    is_due = True  # Simplified - could add more logic for weekdays/custom
                    status = 'missed' if is_due else 'not_logged'
                else:
                    status = 'not_logged'
                
                history.append({
                    'date': current_date.isoformat(),
                    'status': status
                })
                
                current_date += timedelta(days=1)
            
            return jsonify({
                'habit_id': habit_id,
                'habit_name': habit.name,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'total_days': len(history),
                'completed_days': len([h for h in history if h['status'] == 'completed']),
                'history': history
            }), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to get habit history: {str(e)}'}), 500

    @app.route('/api/users', methods=['POST'])
    def create_user():
        """Create a new user (legacy endpoint)"""
        try:
            data = request.get_json()
            
            if not data or 'email' not in data or 'password' not in data:
                return jsonify({'error': 'Email and password are required'}), 400
            
            # Check if user already exists
            existing_user = User.query.filter_by(email=data['email']).first()
            
            if existing_user:
                return jsonify({'error': 'User with this email already exists'}), 409
            
            # Hash the password
            password_hash = generate_password_hash(data['password'])
            user = User(email=data['email'], password_hash=password_hash)
            
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
