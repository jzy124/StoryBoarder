import stripe
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin # 确保 cross_origin 还在
from flask_migrate import Migrate
from flask_login import LoginManager, login_user, logout_user, current_user, login_required

from config import Config
from models import db, User

# --- 初始化应用和扩展 ---
app = Flask(__name__, static_folder='../frontend', static_url_path='/')
app.config.from_object(Config)

# --- 恢复并简化全局CORS配置 ---
# 这个全局配置将处理所有不需要凭证的请求
# 并且为预检请求(OPTIONS)提供基础的CORS头部
CORS(app, origins=["http://localhost:5001", "http://127.0.0.1:5001"], supports_credentials=True)
# ---------------------------------

db.init_app(app)
migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)

# --- 定制Flask-Login的未授权处理 ---
@login_manager.unauthorized_handler
def unauthorized():
    """当 @login_required 装饰器验证失败时，返回JSON格式的错误。"""
    print(" unauthorized_handler 已被触发! 请求被拒绝。")
    return jsonify(error="登录已过期或无效，请重新登录。"), 401

stripe.api_key = app.config['STRIPE_SECRET_KEY']

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- 辅助函数 ---
def user_to_dict(user):
    return {"id": user.id, "email": user.email, "points": user.points}

# --- 静态文件和主页路由 ---
@app.route('/')
def index():
    return app.send_static_file('index.html')

# --- 用户认证 API (不需要凭证) ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "需要邮箱和密码"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "该邮箱已被注册"}), 400

    user = User(email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    print(f"新用户注册成功: {email}")
    return jsonify(user_to_dict(user)), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()

    if user is None or not user.check_password(password):
        return jsonify({"error": "邮箱或密码无效"}), 401

    login_user(user)
    print(f"用户登录成功: {email}")
    return jsonify(user_to_dict(user))

# 在 backend/server.py 中

@app.route('/api/status')
def status():
    # 将配置信息也包含在status响应中
    config_data = {
        "points_per_purchase": app.config['POINTS_PER_PURCHASE'],
        "cost_per_generation": app.config['COST_PER_GENERATION']
    }
    
    if current_user.is_authenticated:
        return jsonify({
            "user": user_to_dict(current_user),
            "config": config_data
        })
    
    # 即使用户未登录，也返回配置信息，以便登录页面可以显示
    return jsonify({
        "user": None,
        "config": config_data
    })

# --- 需要认证的 API (使用 @cross_origin) ---
@app.route('/api/logout', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def logout():
    print(f"用户登出: {current_user.email}")
    logout_user()
    return jsonify({"message": "已成功登出"})

@app.route('/api/generate', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def generate():
    # --- 最终调试：打印所有收到的请求头 ---
    print("\n" + "="*20)
    print(f"--- 调试 /api/generate 请求头 (用户: {current_user}) ---")
    print(request.headers)
    print("="*20 + "\n")
    # ----------------------------------------
    
    print(f"收到来自用户 {current_user.email} 的生成请求。")
    if current_user.points < app.config['COST_PER_GENERATION']:
        print(f"用户 {current_user.email} 点数不足。")
        return jsonify({"error": "点数不足，请充值"}), 402

    current_user.points -= app.config['COST_PER_GENERATION']
    db.session.commit()
    print(f"扣除点数成功。用户 {current_user.email} 剩余点数: {current_user.points}")

    return jsonify({
        "message": "生成成功！",
        "remaining_points": current_user.points
    })

@app.route('/api/create-checkout-session', methods=['POST'])
@cross_origin(supports_credentials=True)
@login_required
def create_checkout_session():
    print(f"为用户 {current_user.email} 创建Stripe支付会话。")
    try:
        checkout_session = stripe.checkout.Session.create(
            client_reference_id=current_user.id,
            line_items=[{'price': app.config['STRIPE_PRICE_ID'], 'quantity': 1}],
            mode='payment',
            success_url=f"{app.config['YOUR_DOMAIN']}/success.html",
            cancel_url=f"{app.config['YOUR_DOMAIN']}/cancel.html",
        )
        return jsonify({'url': checkout_session.url})
    except Exception as e:
        print(f"创建Stripe会话时发生错误: {e}")
        return jsonify(error=str(e)), 403

# --- Webhook (来自外部服务，不需要认证) ---
@app.route('/webhook/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    print("\n--- 收到Stripe Webhook事件 ---")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, app.config['STRIPE_WEBHOOK_SECRET']
        )
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        print(f"Webhook 签名验证失败: {e}")
        return 'Webhook 签名验证失败', 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        if user_id:
            with app.app_context(): # 在Webhook中需要应用上下文来操作数据库
                user = User.query.get(user_id)
                if user:
                    user.points += app.config['POINTS_PER_PURCHASE']
                    db.session.commit()
                    print(f"✅ 支付成功! 已为用户 {user.email} (ID: {user_id}) 增加了 {app.config['POINTS_PER_PURCHASE']} 点数。")
                else:
                    print(f"错误: 支付成功，但找不到用户ID: {user_id}")
        else:
            print("错误: 支付成功，但Stripe会话中缺少 client_reference_id")

    return 'Success', 200

# --- 启动脚本 ---
if __name__ == '__main__':
    # 检查配置是否为占位符
    if app.config['STRIPE_SECRET_KEY'].startswith("sk_test_..."):
        print("\n警告: 您正在使用占位Stripe私钥。")
    if app.config['STRIPE_WEBHOOK_SECRET'].startswith("whsec_..."):
        print("警告: 您正在使用占位Webhook密钥。")
    if app.config['STRIPE_PRICE_ID'].startswith("price_..."):
        print("警告: 您正在使用占位价格ID。")
    
    print("\n服务器正在启动，请访问 http://localhost:5001")
    print("要初始化或升级数据库，请在终端中运行 'flask db upgrade'")
    
    app.run(port=5001, debug=True, use_reloader=True)