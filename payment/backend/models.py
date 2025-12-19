# backend/models.py
from flask_sqlalchemy import SQLAlchemy
# 移除 UserMixin, 因为我们不再使用Flask-Login的session管理
# from flask_login import UserMixin  <--- 如果有这行，也删掉

db = SQLAlchemy()

# --- 核心修改：从类的继承中移除 UserMixin ---
class User(db.Model):
    # 主键是字符串，用来存储Supabase的UUID
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    # password_hash 不再需要
    points = db.Column(db.Integer, default=10, nullable=False)

    def __repr__(self):
        return f'<User {self.email}>'