from flask_sqlalchemy import SQLAlchemy
from datetime import date, datetime
import uuid
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    perfect_days_count = db.Column(db.Integer, default=0)
    perfect_days_dates = db.Column(db.Text, default='')  # Store JSON array of date strings
    
    # Relationship to habits
    habits = db.relationship('Habit', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, email, password_hash):
        self.email = email
        self.password_hash = password_hash
        self.perfect_days_count = 0
        self.perfect_days_dates = ''
    
    def get_perfect_days_set(self):
        """Get the set of perfect days as a Python set"""
        if not self.perfect_days_dates:
            return set()
        try:
            return set(json.loads(self.perfect_days_dates))
        except:
            return set()
    
    def add_perfect_day(self, date_str):
        """Add a date to the perfect days set"""
        perfect_days = self.get_perfect_days_set()
        perfect_days.add(date_str)
        self.perfect_days_dates = json.dumps(list(perfect_days))
        self.perfect_days_count = len(perfect_days)
    
    def remove_perfect_day(self, date_str):
        """Remove a date from the perfect days set"""
        perfect_days = self.get_perfect_days_set()
        perfect_days.discard(date_str)
        self.perfect_days_dates = json.dumps(list(perfect_days))
        self.perfect_days_count = len(perfect_days)
    
    def has_perfect_day(self, date_str):
        """Check if a specific date is in the perfect days set"""
        return date_str in self.get_perfect_days_set()

    def get_next_milestone(self):
        """Get the next milestone and progress towards it with automatic 50-day increments"""
        current_count = self.perfect_days_count
        
        # Calculate the next milestone target based on 50-day increments
        # Bronze (0-49), Silver (50-99), Gold (100-149), Diamond (150+)
        if current_count < 50:
            next_milestone = 50
        elif current_count < 100:
            next_milestone = 100
        elif current_count < 150:
            next_milestone = 150
        else:
            # For Diamond levels (150+), continue in 50-day increments
            next_milestone = ((current_count // 50) + 1) * 50
        
        progress_percentage = (current_count / next_milestone) * 100
        days_remaining = next_milestone - current_count
        
        return {
            'next_milestone': next_milestone,
            'current_count': current_count,
            'progress_percentage': progress_percentage,
            'days_remaining': days_remaining
        }
    
    def to_dict(self):
        milestone_data = self.get_next_milestone()
        return {
            'id': self.id,
            'email': self.email,
            'perfect_days_count': self.perfect_days_count,
            'milestone': milestone_data
        }
    
    def __repr__(self):
        return f'<User {self.email}>'

class Habit(db.Model):
    __tablename__ = 'habits'
    
    id = db.Column(db.Integer, primary_key=True)
    unique_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    target_days = db.Column(db.String(50), nullable=False)  # 'every_day', 'weekdays', 'custom'
    start_date = db.Column(db.Date, nullable=False)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    
    # Relationship to completions
    completions = db.relationship('HabitCompletion', backref='habit', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, user_id, name, target_days, start_date):
        self.unique_id = str(uuid.uuid4())
        self.user_id = user_id
        self.name = name
        self.target_days = target_days
        self.start_date = start_date
        self.current_streak = 0
        self.longest_streak = 0
    
    def is_due_today(self):
        """Check if habit is due today based on target_days"""
        today = date.today()
        weekday = today.weekday()  # 0=Monday, 6=Sunday
        
        if self.target_days == 'every_day':
            return True
        elif self.target_days == 'weekdays':
            return weekday < 5  # Monday to Friday
        # For custom, assume it's always due (can be enhanced later)
        return True
    
    def is_completed_today(self):
        """Check if habit is completed today"""
        today = date.today()
        completion = HabitCompletion.query.filter_by(
            habit_id=self.id,
            completion_date=today
        ).first()
        return completion is not None
    
    def get_completion_timestamp_today(self):
        """Get the completion timestamp for today if completed"""
        today = date.today()
        completion = HabitCompletion.query.filter_by(
            habit_id=self.id,
            completion_date=today
        ).first()
        return completion.completed_at.isoformat() if completion else None

    def to_dict(self):
        completion_timestamp = self.get_completion_timestamp_today()
        return {
            'id': self.id,
            'unique_id': self.unique_id,
            'user_id': self.user_id,
            'name': self.name,
            'target_days': self.target_days,
            'start_date': self.start_date.isoformat() if isinstance(self.start_date, date) else self.start_date,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'is_due_today': self.is_due_today(),
            'is_completed_today': self.is_completed_today(),
            'completion_timestamp': completion_timestamp
        }
    
    def __repr__(self):
        return f'<Habit {self.name}>'


class HabitCompletion(db.Model):
    __tablename__ = 'habit_completions'
    
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False)
    completion_date = db.Column(db.Date, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Ensure one completion per habit per day
    __table_args__ = (db.UniqueConstraint('habit_id', 'completion_date', name='_habit_completion_uc'),)
    
    def __init__(self, habit_id, completion_date=None):
        self.habit_id = habit_id
        self.completion_date = completion_date or date.today()
        self.completed_at = datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'completion_date': self.completion_date.isoformat(),
            'completed_at': self.completed_at.isoformat()
        }
    
    def __repr__(self):
        return f'<HabitCompletion {self.habit_id} on {self.completion_date}>'
