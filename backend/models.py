from flask_sqlalchemy import SQLAlchemy
from datetime import date

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
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    target_days = db.Column(db.String(50), nullable=False)  # 'every_day', 'weekdays', 'custom'
    start_date = db.Column(db.Date, nullable=False)
    
    def __init__(self, user_id, name, target_days, start_date):
        self.user_id = user_id
        self.name = name
        self.target_days = target_days
        self.start_date = start_date
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'target_days': self.target_days,
            'start_date': self.start_date.isoformat() if isinstance(self.start_date, date) else self.start_date
        }
    
    def __repr__(self):
        return f'<Habit {self.name}>'
