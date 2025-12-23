
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentData } from "./types";

/**
 * Recommended models for text tasks according to guidelines:
 * - Complex Text Tasks: 'gemini-3-pro-preview'
 * - Basic Text Tasks: 'gemini-3-flash-preview'
 * - Fallback: 'gemini-flash-lite-latest'
 */
const MODELS_SEQUENCE = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest'
];

export const getSuitabilityAnalysis = async (data: AssessmentData) => {
  // Use process.env.API_KEY exclusively as per guidelines.
  // The API_KEY is provided via the environment.
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    throw new Error("API Key 尚未設定。請確認環境變數 API_KEY。");
  }

  const taskListStr = data.tasks.map(t => `${t.name} (${t.hours}小時)`).join(', ');
  
  const prompt = `
    你是一位資深的人力管理主管，正在評估一位「照顧管家」的人才適性。
    以下是該人才的填寫資訊：
    
    1. 執行過的任務與時數：${taskListStr}
    2. 其他任務補充：${data.otherTasks || '無'}
    3. 特別感興趣的領域：${data.interests.join(', ')}
    4. 其他興趣補充：${data.otherInterests || '無'}

    任務指令：
    1. 基於以上資訊，為五個適性維度評分（0-100分）：
       - 情感支持與社交 (Emotional Support & Social)
       - 醫藥安全監測 (Medical & Safety)
       - 行政管理效能 (Admin & Management)
       - 生活支援實務 (Living Support)
       - 活動策劃引導 (Activity & Planning)
    2. 生成「個人適性建議」(Suitability Advice)：
       - 請以「照顧管家」身分為核心。
       - 應側重說明該管家展現出的核心能力價值。
       - 必須包含具體的「自我成長方向」建議。
    3. 生成「AI 可以怎麼協助你」(AI Assistance)：
       - 必須以「列表 (List)」方式呈現。
       - 推薦具體的 AI 工具名稱。

    請以 JSON 格式回覆。
  `;

  for (const modelName of MODELS_SEQUENCE) {
    try {
      console.log(`正在嘗試呼叫 AI 模型: ${modelName}`);
      
      // Create a new GoogleGenAI instance right before the call to ensure the latest API key is used.
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scores: {
                type: Type.OBJECT,
                properties: {
                  emotional: { type: Type.NUMBER },
                  medical: { type: Type.NUMBER },
                  admin: { type: Type.NUMBER },
                  living: { type: Type.NUMBER },
                  activity: { type: Type.NUMBER }
                },
                required: ['emotional', 'medical', 'admin', 'living', 'activity'],
                propertyOrdering: ['emotional', 'medical', 'admin', 'living', 'activity']
              },
              suitabilityAdvice: { type: Type.STRING },
              aiAssistance: { type: Type.STRING }
            },
            required: ['scores', 'suitabilityAdvice', 'aiAssistance'],
            propertyOrdering: ['scores', 'suitabilityAdvice', 'aiAssistance']
          }
        }
      });

      // Directly access .text property from GenerateContentResponse.
      const text = response.text;
      if (!text) throw new Error("AI 模型回傳空內容");

      return JSON.parse(text.trim());

    } catch (error: any) {
      const errorMessage = error.message || String(error);
      console.error(`模型 ${modelName} 呼叫失敗:`, errorMessage);

      // Stop if API key is explicitly invalid.
      if (errorMessage.includes("API key not valid")) {
        throw new Error("您提供的 API Key 無效，請確認金鑰是否正確。");
      }

      const isRetryable = 
        errorMessage.includes("429") || 
        errorMessage.toLowerCase().includes("quota") ||
        errorMessage.toLowerCase().includes("limit") ||
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("permission denied");

      // Try the next model in sequence if the error is retryable.
      if (isRetryable && modelName !== MODELS_SEQUENCE[MODELS_SEQUENCE.length - 1]) {
        console.warn(`[Fallback] 模型 ${modelName} 無法使用，嘗試下一個...`);
        continue;
      } else {
        throw new Error(modelName === MODELS_SEQUENCE[MODELS_SEQUENCE.length - 1] && isRetryable ? "額度已用完" : errorMessage);
      }
    }
  }
  throw new Error("無法取得分析結果");
};
