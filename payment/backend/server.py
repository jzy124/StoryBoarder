# storyboarder/payment/backend/server.py (最终集成版)

import os
import stripe
import jwt
from jwt import algorithms as jwt_algorithms
import datetime
from functools import wraps
from flask import Flask, request, jsonify, current_app as app
from flask_cors import CORS
from flask_migrate import Migrate
import logging # 导入日志模块
import requests # 需要安装 requests 库: pip install requests

from config import Config
from models import db, User

# --- 配置日志 ---
logging.basicConfig(level=logging.INFO)

# --- 初始化应用 ---
app = Flask(__name__)
app.config.from_object(Config)

print(f"--- DEBUG: Loaded SUPABASE_JWT_SECRET is: {app.config.get('SUPABASE_JWT_SECRET')} ---")

# --- 最终的、最强力的CORS配置 ---
# 我们允许任何来源(*)在开发环境中访问，并确保所有必需的头部都已设置
# 这可以彻底排除CORS配置错误
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
# -----------------------------------

db.init_app(app)
migrate = Migrate(app, db)
stripe.api_key = app.config['STRIPE_SECRET_KEY']

# --- 新的、基于JWKS的JWT认证装饰器 ---

# 你的Supabase JWKS端点URL
# ！！！请务必用你自己的项目URL替换掉这里的占位符！！！
SUPABASE_JWKS_URL = 'https://kpbubonhlbmqucmijmfr.supabase.co/auth/v1/.well-known/jwks.json' 

# 在 backend/server.py 顶部
import json
import time

# --- 使用文件作为持久化缓存 ---
JWKS_CACHE_FILE = 'jwks_cache.json'
JWKS_CACHE_TTL_SECONDS = 3600 # 缓存有效期1小时

def get_signing_key(token):
    """
    从JWKS端点获取公钥，并使用文件进行持久化缓存。
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        if not kid: raise Exception("Token header is missing 'kid'")

        # 1. 尝试从文件缓存加载
        if os.path.exists(JWKS_CACHE_FILE):
            with open(JWKS_CACHE_FILE, 'r') as f:
                try:
                    cache_data = json.load(f)
                    # 检查缓存是否过期
                    if time.time() - cache_data.get('timestamp', 0) < JWKS_CACHE_TTL_SECONDS:
                        key_dict = cache_data.get('keys', {}).get(kid)
                        if key_dict:
                            print(f"--- Found key for kid '{kid}' in file cache. ---")
                            return jwt_algorithms.ECAlgorithm.from_jwk(key_dict) # 假设是EC
                except (json.JSONDecodeError, KeyError):
                    print("--- File cache is invalid. Fetching new keys. ---")

        # 2. 如果缓存没有或无效，则从网络获取
        print("--- JWKS Cache miss or expired. Fetching latest keys from Supabase... ---")
        jwks_response = requests.get(SUPABASE_JWKS_URL)
        jwks_response.raise_for_status()
        jwks = jwks_response.json()

        # 3. 处理并写入缓存文件
        keys_to_cache = {key.get('kid'): key for key in jwks.get('keys', []) if key.get('kid')}
        with open(JWKS_CACHE_FILE, 'w') as f:
            json.dump({'timestamp': time.time(), 'keys': keys_to_cache}, f)
        
        # 4. 从刚获取的数据中寻找key
        key_to_use_dict = keys_to_cache.get(kid)
        if key_to_use_dict:
            key_type = key_to_use_dict.get('kty')
            if key_type == 'EC': return jwt_algorithms.ECAlgorithm.from_jwk(key_to_use_dict)
            elif key_type == 'RSA': return jwt_algorithms.RSAAlgorithm.from_jwk(key_to_use_dict)
            elif key_type == 'OKP': return jwt_algorithms.EdDSAAlgorithm.from_jwk(key_to_use_dict)

        raise Exception(f"Unable to find appropriate key for kid: {kid} in fetched JWKS.")
        
    except Exception as e:
        app.logger.error(f"Error getting signing key: {e}")
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': '授权Token缺失'}), 401
        
        try:
            # --- 核心修正：简化调用逻辑 ---
            # 直接调用新的 get_signing_key 函数，不再需要重试
            signing_key = get_signing_key(token)
            
            # 如果获取密钥失败，直接返回错误
            if not signing_key:
                # get_signing_key 内部已经打印了详细日志，这里只返回通用错误
                return jsonify({'error': '无法验证签名密钥'}), 500
            
            # -----------------------------

            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["ES256", "RS256", "EdDSA"],
                audience='authenticated'
            )
            
            # --- 用户同步逻辑保持不变 ---
            supabase_user_id = payload.get('sub')
            if not supabase_user_id:
                return jsonify({'error': 'Token中缺少用户信息(sub)'}), 401

            current_user = User.query.filter_by(id=supabase_user_id).first()

            if not current_user:
                user_email = payload.get('email')
                if not user_email:
                    return jsonify({'error': 'Token中缺少email信息，无法自动注册'}), 400
                current_user = User(
                    id=supabase_user_id,
                    email=user_email,
                )
                db.session.add(current_user)
                db.session.commit()
            
            return f(current_user, *args, **kwargs)

        except (jwt.ExpiredSignatureError, jwt.InvalidAudienceError, jwt.InvalidTokenError) as e:
            app.logger.error(f"JWT验证失败: {e}")
            return jsonify({'error': '无效的Token或已过期'}), 401
        except Exception as e:
            app.logger.error(f"认证过程中发生未知错误: {e}")
            return jsonify({'error': f'认证失败: {str(e)}'}), 500
        
    return decorated

# --- 辅助函数 ---
def user_to_dict(user):
    return {"id": user.id, "email": user.email, "points": user.points}

# --- API 路由 ---
@app.route('/api/user/profile')
@token_required
def get_user_profile(current_user):
    """获取用户的点数和应用配置"""
    config_data = {
        "points_per_purchase": app.config['POINTS_PER_PURCHASE'],
        "cost_per_generation": app.config['COST_PER_GENERATION']
    }
    return jsonify({ "user": user_to_dict(current_user), "config": config_data })

@app.route('/api/generate', methods=['POST'])
@token_required
def generate(current_user):
    """处理生成请求并扣除点数"""
    if current_user.points < app.config['COST_PER_GENERATION']:
        return jsonify({"error": "点数不足，请充值"}), 402
    current_user.points -= app.config['COST_PER_GENERATION']
    db.session.commit()
    return jsonify({ "message": "点数扣除成功！", "remaining_points": current_user.points })

@app.route('/api/create-checkout-session', methods=['POST'])
@token_required
def create_checkout_session(current_user):
    """为当前登录用户创建Stripe支付会话"""
    try:
        # 成功/取消URL现在应该指向你的Vite前端应用
        success_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') + '/payment-success'
        cancel_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') + '/'

        checkout_session = stripe.checkout.Session.create(
            client_reference_id=current_user.id,
            line_items=[{'price': app.config['STRIPE_PRICE_ID'], 'quantity': 1}],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return jsonify({'url': checkout_session.url})
    except Exception as e:
        return jsonify(error=str(e)), 403

@app.route('/webhook/stripe', methods=['POST'])
def stripe_webhook():
    """接收Stripe事件，更新用户点数"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, app.config['STRIPE_WEBHOOK_SECRET'])
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        return 'Webhook签名验证失败', 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        if user_id:
            with app.app_context():
                user = User.query.get(user_id)
                if user:
                    user.points += app.config['POINTS_PER_PURCHASE']
                    db.session.commit()
                    print(f"✅ 支付成功! 已为用户 {user.id} 增加了点数。")
    return 'Success', 200

if __name__ == '__main__':
    app.run(port=5001, debug=True)