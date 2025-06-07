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

def calculate_current_streak(habit):
    """Calculate streak based on previous day completion, then add today if completed"""
    from datetime import date, timedelta, datetime
    
    current_date = date.today()
    
    # Safety check - don't go back before habit start date
    habit_start = habit.start_date
    if isinstance(habit_start, str):
        try:
            habit_start = datetime.strptime(habit_start, '%Y-%m-%d').date()
        except ValueError:
            return 0
    
    # Step 1: Determine base streak from previous assigned day
    base_streak = 0
    previous_date = current_date - timedelta(days=1)
    
    # Find the immediate previous day when habit was due
    while previous_date >= habit_start:
        if is_habit_due_on_date(habit, previous_date):
            # Found the immediate previous assigned day
            previous_completion = HabitCompletion.query.filter_by(
                habit_id=habit.id,
                completion_date=previous_date
            ).first()
            
            if previous_completion:
                # Previous day was completed - use current streak value
                base_streak = habit.current_streak
            else:
                # Previous day was missed - reset to 0
                base_streak = 0
            break
        
        previous_date -= timedelta(days=1)
    
    # Step 2: If today is due and completed, add 1 to base streak
    if is_habit_due_on_date(habit, current_date):
        today_completion = HabitCompletion.query.filter_by(
            habit_id=habit.id,
            completion_date=current_date
        ).first()
        
        if today_completion:
            return base_streak + 1
        else:
            # Due today but not completed
            return 0
    else:
        # Not due today - return base streak
        return base_streak

def is_habit_due_on_date(habit, check_date):
    """Check if a habit is due on a specific date based on target_days and start_date"""
    from datetime import date, datetime
    
    # Handle habit start date conversion
    habit_start = habit.start_date
    if isinstance(habit_start, str):
        try:
            habit_start = datetime.strptime(habit_start, '%Y-%m-%d').date()
        except ValueError:
            return False
    
    # Check if the date is on or after the habit start date
    if check_date < habit_start:
        return False
    
    # Get day of week (0=Monday, 6=Sunday in our backend format)
    day_of_week = check_date.weekday()
    
    if habit.target_days == 'every_day':
        return True
    elif habit.target_days == 'weekdays':
        return day_of_week < 5  # Monday to Friday
    else:
        # Handle custom days like "monday,wednesday,friday"
        weekday_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        today_name = weekday_names[day_of_week]
        
        if ',' in habit.target_days:
            selected_days = [day.strip().lower() for day in habit.target_days.split(',')]
            return today_name in selected_days
        else:
            return habit.target_days.lower() == today_name

def recalculate_all_streaks():
    """Recalculate current streaks for all habits"""
    try:
        habits = Habit.query.all()
        for habit in habits:
            old_streak = habit.current_streak
            new_streak = calculate_current_streak(habit)
            if old_streak != new_streak:
                habit.current_streak = new_streak
                print(f"Updated habit '{habit.name}' streak from {old_streak} to {new_streak}")
        db.session.commit()
        print(f"Recalculated streaks for {len(habits)} habits")
    except Exception as e:
        print(f"Error recalculating streaks: {e}")
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
        # initialize_database()  # Commented out to preserve cleaned data
        recalculate_all_streaks()
    
    # Helper function to update perfect day status
    def update_perfect_day_status(user_id, today):
        """Update perfect day status for a user on a given date"""
        user = User.query.get(user_id)
        if not user:
            return
        
        # Get all habits due today for this user
        user_habits = Habit.query.filter_by(user_id=user_id).all()
        habits_due_today = [h for h in user_habits if h.is_due_today()]
        
        # Check if all habits due today are completed
        all_completed = True
        for due_habit in habits_due_today:
            habit_completed = HabitCompletion.query.filter_by(
                habit_id=due_habit.id,
                completion_date=today
            ).first()
            if not habit_completed:
                all_completed = False
                break
        
        # Update perfect day status
        today_str = today.isoformat()
        if all_completed and len(habits_due_today) > 0:
            # Add today to perfect days if not already there
            if not user.has_perfect_day(today_str):
                user.add_perfect_day(today_str)
        else:
            # Remove today from perfect days if it was there but no longer complete
            if user.has_perfect_day(today_str):
                user.remove_perfect_day(today_str)

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
            
            # Recalculate perfect day status since a new habit affects today's requirements
            today = date.today()
            update_perfect_day_status(current_user_id, today)
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
            
            # Get optional local date for timezone-aware habit checking
            local_date_str = request.args.get('local_date')
            if local_date_str:
                try:
                    local_date = datetime.strptime(local_date_str, '%Y-%m-%d').date()
                except ValueError:
                    local_date = date.today()
            else:
                local_date = date.today()
            
            habits = Habit.query.filter_by(user_id=current_user_id).all()
            
            # Convert habits to dict with timezone-aware date checking
            habits_data = []
            for habit in habits:
                habit_dict = habit.to_dict()
                # Override is_due_today with timezone-aware check
                habit_dict['is_due_today'] = habit.is_due_today(local_date)
                # Override is_completed_today with timezone-aware check
                completion = HabitCompletion.query.filter_by(
                    habit_id=habit.id,
                    completion_date=local_date
                ).first()
                habit_dict['is_completed_today'] = completion is not None
                if completion:
                    habit_dict['completion_timestamp'] = completion.completed_at.isoformat()
                else:
                    habit_dict['completion_timestamp'] = None
                habits_data.append(habit_dict)
            
            return jsonify({
                'habits': habits_data,
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
            
            # Get timezone-aware date from frontend or use server date as fallback
            data = request.get_json() or {}
            local_date_str = data.get('local_date')
            
            if local_date_str:
                try:
                    today = datetime.strptime(local_date_str, '%Y-%m-%d').date()
                except ValueError:
                    today = date.today()
            else:
                today = date.today()
            
            # Find habit belonging to current user
            habit = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first()
            
            if not habit:
                return jsonify({'error': 'Habit not found or access denied'}), 404
            
            # Check if already completed today
            existing_completion = HabitCompletion.query.filter_by(
                habit_id=habit_id,
                completion_date=today
            ).first()
            
            if existing_completion:
                return jsonify({'error': 'Habit already completed today'}), 409
            
            # Store UTC timestamp for consistent timezone handling
            local_timestamp = data.get('local_timestamp')
            print(f"DEBUG: Received local_timestamp from frontend: {local_timestamp}")
            
            if local_timestamp:
                # Parse the ISO timestamp as UTC (frontend sends local time as UTC)
                completion_time = datetime.fromisoformat(local_timestamp.replace('Z', '+00:00'))
                print(f"DEBUG: Storing UTC completion_time: {completion_time}")
            else:
                completion_time = datetime.utcnow()
                print(f"DEBUG: No local timestamp, using UTC: {completion_time}")
            
            # Create completion record with accurate timestamp
            completion = HabitCompletion(habit_id=habit_id, completion_date=today)
            completion.completed_at = completion_time
            print(f"DEBUG: Stored completion.completed_at: {completion.completed_at}")
            db.session.add(completion)
            
            # Calculate current streak properly
            habit.current_streak = calculate_current_streak(habit)
            if habit.current_streak > habit.longest_streak:
                habit.longest_streak = habit.current_streak
            
            # Update perfect day tracking - moved to separate function to avoid duplication
            update_perfect_day_status(current_user_id, today)
            
            db.session.commit()
            
            # Get perfect day status for response
            user = User.query.get(current_user_id)
            user_habits = Habit.query.filter_by(user_id=current_user_id).all()
            habits_due_today = [h for h in user_habits if h.is_due_today()]
            all_completed = all(
                HabitCompletion.query.filter_by(habit_id=h.id, completion_date=today).first()
                for h in habits_due_today
            )
            
            # Prepare habit data with correct completion status
            habit_data = habit.to_dict()
            habit_data['is_completed_today'] = True
            habit_data['completion_timestamp'] = completion.completed_at.isoformat()
            habit_data['is_due_today'] = habit.is_due_today(today)
            
            return jsonify({
                'message': 'Habit completed successfully',
                'habit': habit_data,
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
            
            # Get timezone-aware date from frontend or use server date as fallback
            data = request.get_json() or {}
            local_date_str = data.get('local_date')
            
            if local_date_str:
                try:
                    today = datetime.strptime(local_date_str, '%Y-%m-%d').date()
                except ValueError:
                    today = date.today()
            else:
                today = date.today()
            
            # Find habit belonging to current user
            habit = Habit.query.filter_by(id=habit_id, user_id=current_user_id).first()
            
            if not habit:
                return jsonify({'error': 'Habit not found or access denied'}), 404
            
            # Find today's completion
            completion = HabitCompletion.query.filter_by(
                habit_id=habit_id,
                completion_date=today
            ).first()
            
            if not completion:
                return jsonify({'error': 'Habit not completed today'}), 404
            
            # Remove completion record
            db.session.delete(completion)
            
            # Recalculate current streak properly
            habit.current_streak = calculate_current_streak(habit)
            
            # Update perfect day tracking after uncompleting habit
            update_perfect_day_status(current_user_id, today)
            
            db.session.commit()
            
            # Prepare habit data with correct completion status
            habit_data = habit.to_dict()
            habit_data['is_completed_today'] = False
            habit_data['completion_timestamp'] = None
            habit_data['is_due_today'] = habit.is_due_today(today)
            
            return jsonify({
                'message': 'Habit uncompleted successfully',
                'habit': habit_data
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
