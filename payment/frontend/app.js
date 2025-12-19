// frontend/app.js (最终健壮版)

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:5001/api';

    // --- 统一获取所有需要的DOM元素 ---
    const elements = {
        authView: document.getElementById('auth-view'),
        appView: document.getElementById('app-view'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        userEmailSpan: document.getElementById('user-email'),
        userPointsSpan: document.getElementById('user-points'),
        statusMessage: document.getElementById('status-message'),
        
        // 按钮
        loginBtn: document.getElementById('login-btn'),
        registerBtn: document.getElementById('register-btn'),
        generateBtn: document.getElementById('generate-btn'),
        purchaseBtn: document.getElementById('purchase-btn'),
        logoutBtn: document.getElementById('logout-btn'),

        // 输入框
        loginEmailInput: document.getElementById('login-email'),
        loginPasswordInput: document.getElementById('login-password'),
        registerEmailInput: document.getElementById('register-email'),
        registerPasswordInput: document.getElementById('register-password'),

        // 表单切换链接
        showRegisterLink: document.getElementById('show-register'),
        showLoginLink: document.getElementById('show-login'),
    };

    // --- 健壮性检查：确保所有元素都找到了 ---
    for (const key in elements) {
        if (!elements[key]) {
            console.error(`关键DOM元素未找到: #${key.replace('Btn', '-btn').replace('Link', '')}`);
            alert(`页面加载错误：找不到元素 ${key}。请检查 index.html 的 id 是否正确。`);
            return; // 中断后续所有代码的执行
        }
    }

    // --- API 请求函数 (保持不变) ---
    async function apiRequest(endpoint, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            };
            if (body) {
                options.body = JSON.stringify(body);
            }
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '发生未知错误');
            }
            return data;
        } catch (error) {
            elements.statusMessage.textContent = error.message;
            throw error;
        }
    }

    // --- UI 更新函数 (保持不变) ---
    function updateUI(user, config) {
        elements.statusMessage.textContent = '';
        if (user) {
            elements.authView.style.display = 'none';
            elements.appView.style.display = 'block';
            elements.userEmailSpan.textContent = user.email;
            elements.userPointsSpan.textContent = user.points;
        } else {
            elements.authView.style.display = 'block';
            elements.appView.style.display = 'none';
        }
        if (config) {
            elements.generateBtn.textContent = `生成内容 (消耗${config.cost_per_generation}点数)`;
            elements.purchaseBtn.textContent = `购买${config.points_per_purchase}点数`;
        }
    }

    // --- 状态检查函数 (保持不变) ---
    async function checkStatus() {
        try {
            const data = await apiRequest('/status');
            updateUI(data.user, data.config);
        } catch (error) {
            updateUI(null, null);
        }
    }

    // --- 事件监听 (现在使用 elements 对象) ---
    elements.showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.loginForm.style.display = 'none';
        elements.registerForm.style.display = 'block';
    });

    elements.showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.loginForm.style.display = 'block';
        elements.registerForm.style.display = 'none';
    });
    
    elements.registerBtn.addEventListener('click', async () => {
        const email = elements.registerEmailInput.value;
        const password = elements.registerPasswordInput.value;
        try {
            await apiRequest('/register', 'POST', { email, password });
            elements.statusMessage.textContent = '注册成功！请登录。';
            elements.showLoginLink.click();
        } catch (error) {}
    });

    elements.loginBtn.addEventListener('click', async () => {
        const email = elements.loginEmailInput.value;
        const password = elements.loginPasswordInput.value;
        try {
            await apiRequest('/login', 'POST', { email, password });
            await checkStatus();
        } catch (error) {}
    });

    elements.logoutBtn.addEventListener('click', async () => {
        try {
            await apiRequest('/logout', 'POST');
            updateUI(null, null);
        } catch (error) {}
    });
    
    elements.generateBtn.addEventListener('click', async () => {
        try {
            const data = await apiRequest('/generate', 'POST');
            elements.statusMessage.textContent = `${data.message} 您剩余 ${data.remaining_points} 点数。`;
            elements.userPointsSpan.textContent = data.remaining_points;
        } catch (error) {}
    });

    elements.purchaseBtn.addEventListener('click', async () => {
        try {
            const data = await apiRequest('/create-checkout-session', 'POST');
            window.location.href = data.url;
        } catch (error) {}
    });

    // --- 初始加载 ---
    checkStatus();
});