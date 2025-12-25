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

// // /**
// //  * (已升级) 扣除指定数量的点数
// //  * @param amount 要扣除的点数数量
// //  * @returns {Promise<{ remaining_points: number }>}
// //  */
// export const deductPointsForGeneration = async (amount: number): Promise<{ remaining_points: number }> => {
//   const headers = await getAuthHeaders();
  
//   // 确保 Content-Type 被正确设置
//   headers['Content-Type'] = 'application/json';

//   const response = await fetch(`${API_BASE_URL}/generate`, {
//     method: 'POST',
//     headers,
//     // --- 核心修改：在请求体中发送要扣除的数量 ---
//     body: JSON.stringify({ amount: amount })
//   });
  
//   const data = await response.json();
//   if (!response.ok) {
//     throw new Error(data.error || '扣点失败');
//   }
//   return data;
// };


export const deductPointsForGeneration = async (amount: number): Promise<{ remaining_points: number }> => {
  console.log("[deductPoints] Function started. Amount:", amount);

  try {
    console.log("[deductPoints] AWAITING auth headers...");

    const headers = await getAuthHeaders();
    console.log("[deductPoints] Auth headers COMPLETE. Headers contain Authorization:", 'Authorization' in headers);

    headers['Content-Type'] = 'application/json';
    const finalUrl = `${API_BASE_URL}/generate`;

    console.log(`[deductPoints] Preparing to FETCH ${finalUrl}...`);
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: amount })
    });
    console.log(`[deductPoints] FETCH call returned with status: ${response.status}`);
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '扣点失败');
    }
    console.log("[deductPoints] Function finished successfully.");
    return data;
  } catch (error) {
      console.error("[deductPoints] FAILED with error:", error);
      throw error;
  }
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