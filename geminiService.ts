
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentData } from "./types";

const MODELS_SEQUENCE = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest'
];

export const getSuitabilityAnalysis = async (data: AssessmentData) => {
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    throw new Error("API Key 尚未設定。");
  }

  const taskListStr = data.tasks.map(t => `${t.name} (${t.hours}小時)`).join(', ');
  
  const prompt = `
    你是一位資深的人力管理主管與職能分析專家，正在為一位「照顧管家」撰寫「單日」評估報告。
    
    【輸入數據】
    - 姓名：${data.userName}
    - 今日總工時：${data.totalDailyHours} 小時
    - 今日任務：${taskListStr}
    - 其他補充：${data.otherTasks}

    【分析指令】
    1. 職能評分 (0-100)：
       針對「情感支持與社交、醫藥安全監測、行政管理效能、生活支援實務、活動策劃引導」五項給分。

    2. 當日安排說評 (Suitability Advice)：
       - 提供「當日工作安排的簡單說評」。
       - 分析其今日任務分配的專業度與效率。
       - 內容需精簡專業，具行政指導價值。

    3. AI 協助方案 (AI Assistance)：
       - 針對此人的今日任務，列出「哪些生成式 AI 或工具可以協助自動化或提升效率」。
       - 提供應用情境。

    請嚴格遵守 JSON 格式回覆。
  `;

  for (const modelName of MODELS_SEQUENCE) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
                required: ['emotional', 'medical', 'admin', 'living', 'activity']
              },
              suitabilityAdvice: { type: Type.STRING },
              aiAssistance: { type: Type.STRING }
            },
            required: ['scores', 'suitabilityAdvice', 'aiAssistance']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("API 回傳為空");
      return JSON.parse(text.trim());
    } catch (error: any) {
      if (modelName === MODELS_SEQUENCE[MODELS_SEQUENCE.length - 1]) throw error;
      continue;
    }
  }
};
