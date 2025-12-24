
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentData } from "./types";

const MODELS_SEQUENCE = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest'
];

export const getSuitabilityAnalysis = async (data: AssessmentData) => {
  if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
    throw new Error("API Key 尚未設定。請確認環境變數 API_KEY。");
  }

  const taskListStr = data.tasks.map(t => `${t.name} (${t.hours}小時)`).join(', ');
  
  const prompt = `
    你是一位資深的人力管理主管與職能分析專家，正在為一位「照顧管家」撰寫深度的人才適性評估報告。
    
    【受測人才基本資訊】
    - 姓名：${data.userName}
    - 上周總工時：${data.totalWeeklyHours} 小時
    
    【目前執行狀況明細】
    1. 具體列出的任務與時數：${taskListStr}
    2. 其他補充任務：${data.otherTasks || '無'}
    3. 特別感興趣的領域：${data.interests.join(', ')}
    4. 其他興趣補充：${data.otherInterests || '無'}

    【任務指令】
    請產出以下內容：

    1. 為五個職能維度評分 (0-100)：
       - 情感支持與社交 (Emotional Support & Social)
       - 醫藥安全監測 (Medical & Safety)
       - 行政管理效能 (Admin & Management)
       - 生活支援實務 (Living Support)
       - 活動策劃引導 (Activity & Planning)

    2. 從以下標籤清單中，挑選 2-4 個最符合該人才特質的標籤：
       標籤清單：打掃專門、打掃很厲害、很能聊天、生活大專家、運動專業戶、行政人才、都在打字、社交鬼才。

    3. 撰寫「個人適性建議」(Suitability Advice)：
       - 開頭親切稱呼「${data.userName}」。
       - 分析時數分配與感興趣領域的契合度。
       - **撰寫至少 600 字以上的專業職能分析**，不要使用大首字，維持一般文字。
       - 給予三個職業成長策略。

    4. 生成「AI 可以怎麼協助你」(AI Assistance)：
       - 提供 3-5 個具體的 AI 工具應用情境。

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

      const text = response.text;
      if (!text) throw new Error("AI 模型回傳空內容");
      return JSON.parse(text.trim());
    } catch (error: any) {
      if (modelName === MODELS_SEQUENCE[MODELS_SEQUENCE.length - 1]) throw error;
      continue;
    }
  }
};
