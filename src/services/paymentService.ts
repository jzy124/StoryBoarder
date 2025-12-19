// frontend/src/services/paymentService.ts

import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:5001/api';

// 这是一个辅助函数，用于获取JWT并构造请求头
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('用户未登录');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

interface UserProfile {
  id: string;
  email: string;
  points: number;
}

interface AppConfig {
  points_per_purchase: number;
  cost_per_generation: number;
}

// 获取用户点数和应用配置
export const getUserProfile = async (): Promise<{ user: UserProfile, config: AppConfig }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/user/profile`, { headers });
  if (!response.ok) {
    throw new Error('无法获取用户数据');
  }
  return response.json();
};

// 模拟生成并扣除点数
export const deductPointsForGeneration = async (): Promise<{ remaining_points: number }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '生成失败');
  }
  return data;
};

// 创建Stripe支付链接
export const createCheckoutSession = async (): Promise<{ url: string }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: 'POST',
    headers,
  });
   const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || '无法创建支付链接');
  }
  return data;
};