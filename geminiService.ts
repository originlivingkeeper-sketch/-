
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
    你是一位資深的人力管理主管與職能分析專家，正在為一位「照顧管家」撰寫深度的人才評估報告。
    
    【輸入數據】
    - 姓名：${data.userName}
    - 總工時：${data.totalWeeklyHours} 小時
    - 任務：${taskListStr}
    - 其他補充：${data.otherTasks}
    - 興趣項目：${data.interests.join(', ')}
    - 其他興趣補充：${data.otherInterests}

    【分析指令】
    1. 職能評分 (0-100)：
       針對「情感支持與社交、醫藥安全監測、行政管理效能、生活支援實務、活動策劃引導」五項給分。

    2. 工作效率與量能剖析 (Suitability Advice)：
       - 以「照顧管家的工作效率與量能」為前提，進行個人興趣剖析。
       - 分析其勾選的任務時數與個人興趣是否達成正向循環。
       - 撰寫至少 800 字，口吻專業、細膩且具行政指導意義。

    3. AI 協助方案 (AI Assistance)：
       - 針對此人的個人興趣與適才項目，列出「哪些生成式 AI 或工具可以協助任務執行」。
       - 提供具體工具名稱（如 ChatGPT, Midjourney, Notion AI 等）與應用情境。

    4. 指定人才標籤 (Tags)：
       - **必須**從以下清單中選擇 3-4 個最適標籤，嚴禁自創：
       「打掃專門」、「打掃很厲害」、「很能聊天」、「生活大專家」、「運動專業戶」、「行政人才」、「都在打字」、「社交鬼才」。

    請以 JSON 格式回覆。
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
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suitabilityAdvice: { type: Type.STRING },
              aiAssistance: { type: Type.STRING }
            },
            required: ['scores', 'tags', 'suitabilityAdvice', 'aiAssistance']
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      return JSON.parse(text.trim());
    } catch (error: any) {
      if (modelName === MODELS_SEQUENCE[MODELS_SEQUENCE.length - 1]) throw error;
      continue;
    }
  }
};
