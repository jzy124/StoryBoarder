// src/services/qwenService.js

const API_BASE_URL = '/api'; 

/**
 * 调用后端API将长故事拆分为场景
 * @param {string} rawStory 原始故事文本
 * @returns {Promise<Array<{id: string, description: string}>>}
 */
// 在 qwenService.js 里找到这个函数

// 在 frontend/src/services/qwenService.js

export const breakdownStory = async (rawStory) => {
  try {
    const response = await fetch(`${API_BASE_URL}/breakdown-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ story: rawStory }),
    });

    // 如果响应状态不是 2xx (例如 400, 401, 500), 抛出错误进入catch块
    if (!response.ok) {
      // 尝试解析错误信息，以便更清晰地调试
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.details || errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // 关键检查：确保 data.scenes 是一个数组
    if (Array.isArray(data.scenes)) {
      // 成功！返回后端处理好的场景数组
      return data.scenes.map(scene => ({ ...scene, isGenerating: false }));
    } else {
      // 如果后端返回了成功状态码，但数据格式不对，我们也抛出错误
      throw new Error("API返回了无效的数据格式，期望得到一个 'scenes' 数组。");
    }

  } catch (error) {
    console.error("在 breakdownStory 中捕获到错误:", error);
    // 统一的错误处理：返回一个包含清晰错误信息的回退场景
    // 并且把这个错误重新抛出，让调用它的函数也能感知到失败
    const fallbackScene = [{ id: '1', description: `故事拆分失败: ${error.message}\n\n原始故事:\n${rawStory}`, isGenerating: false }];
    
    // 这里我们直接返回这个 fallback 场景，App.tsx 会处理它
    return fallbackScene;
  }
};

/**
 * 调用后端API分析角色图片的特征
 * @param {string} imageBase64 图片的Base64编码
 * @returns {Promise<string>}
 */
export const analyzeCharacterFromImage = async (imageBase64) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_base64: imageBase64 }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("Failed to analyze character image:", error);
    return `图片分析失败: ${error.message}`;
  }
};

// 在 frontend/src/services/qwenService.js

/**
 * (已回退) 调用后端API根据prompt生成图片
 * @param {string} finalPrompt 最终的生成提示词
 * @param {string|undefined} refImage (此参数在此版本中不再使用)
 * @returns {Promise<string>} 返回生成的图片URL
 */
export const generateImageFromPrompt = async (finalPrompt, refImage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // body中只发送 prompt，不再发送 ref_image_base64
      body: JSON.stringify({ 
        prompt: finalPrompt
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Failed to generate image:", error);
    throw error;
  }
};