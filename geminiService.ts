
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
       - 情感支持與社交、醫藥安全監測、行政管理效能、生活支援實務、活動策劃引導。

    2. 深度剖析 (Suitability Advice)：
       - 以「照顧管家的工作效率與量能」為前提，結合個人興趣進行剖析。
       - 分析其實際執行的任務與其興趣是否契合。
       - **撰寫至少 800 字的專業分析**，段落分明，語氣親切且具指導性。

    3. AI 協作建議 (AI Assistance)：
       - 針對此人的個人興趣與適才項目，列出「哪些生成式 AI 或工具可以協助任務執行」。
       - 提供具體的應用場景。

    4. 給予標籤 (Tags)：
       - **必須**且**僅能**從以下清單中選擇 2-4 個：
       「打掃專門」、「打掃很厲害」、「很能聊天」、「生活大專家」、「運動專業戶」、「行政人才」、「都在打字」、「社交鬼才」。

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

      return JSON.parse(response.text.trim());
    } catch (error: any) {
      if (modelName === MODELS_SEQUENCE[MODELS_SEQUENCE.length - 1]) throw error;
      continue;
    }
  }
};
