import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-hard-to-guess-string'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # --- 新增的 Session Cookie 配置 ---
    # 设置SameSite属性为'Lax' (宽松)，这是在HTTP本地开发中最常用的安全设置
    SESSION_COOKIE_SAMESITE = 'Lax' 
    # 推荐开启，防止客户端JavaScript直接访问cookie，增加安全性
    SESSION_COOKIE_HTTPONLY = True
    # ------------------------------------
    SERVER_NAME = 'localhost:5001'
    
    # Stripe Keys
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_...')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_...')
    STRIPE_PRICE_ID = os.environ.get('STRIPE_PRICE_ID', 'price_...')
    
    # 应用相关配置
    YOUR_DOMAIN = 'http://localhost:5001'
    POINTS_PER_PURCHASE = 10 # 每次购买增加的点数
    COST_PER_GENERATION = 1  # 每次生成消耗的点数
