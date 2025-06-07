from flask_sqlalchemy import SQLAlchemy
from datetime import date, datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Relationship to habits
    habits = db.relationship('Habit', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, email, password_hash):
        self.email = email
        self.password_hash = password_hash
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email
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
    
    def to_dict(self):
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
            'is_completed_today': self.is_completed_today()
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
