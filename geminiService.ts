import { GoogleGenerativeAI } from "@google/generative-ai"; // 👈 必须是这个新库
import { Scene } from "../types";

// 初始化客户端 (适配 Vercel 环境)
const getClient = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Missing Google API Key");
        throw new Error("Google API Key not found");
    }
    return new GoogleGenerativeAI(apiKey);
}

// 1. 拆解故事
export const breakdownStory = async (storyText: string): Promise<Scene[]> => {
  try {
    const genAI = getClient();
    // 👇 这里一定要用 getGenerativeModel
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', // 为了稳妥，我们先用 1.5 验证 (它一定存在)
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are a professional storyboard artist. Break down the following user research story into 3-6 distinct visual scenes for a comic strip.
    Return a JSON array of objects with "description" field.
    Story: ${storyText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text);
    
    return parsed.map((item: any, index: number) => ({
      id: Date.now().toString() + index,
      description: item.description,
      imageUrl: undefined,
      isGenerating: false
    }));
  } catch (error) {
    console.error("Breakdown Error:", error);
    // 兜底
    return [{ id: '1', description: storyText.slice(0, 50) }];
  }
};

// 2. 角色分析 (保持空实现防止报错)
export const analyzeCharacterFromImage = async (base64Image: string): Promise<string> => {
  return ""; 
};

// 3. 生成图片 (保持空实现防止报错)
export const generateImageFromPrompt = async (promptText: string, refImg?: string): Promise<string> => {
    // 暂时返回假图片，先跑通流程
    return "https://placehold.co/600x400?text=Generating...";
};