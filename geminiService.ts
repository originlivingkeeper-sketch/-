
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
    請根據上述數據進行嚴謹的分析，並產出以下內容：

    1. 為以下五個職能維度進行 0-100 的定量評分：
       - 情感支持與社交 (Emotional Support & Social)
       - 醫藥安全監測 (Medical & Safety)
       - 行政管理效能 (Admin & Management)
       - 生活支援實務 (Living Support)
       - 活動策劃引導 (Activity & Planning)

    2. 撰寫極為詳盡的「個人適性建議」(Suitability Advice)：
       - 開頭請親切地稱呼「${data.userName}」。
       - 深度分析其目前的時間分配比例與其感興趣領域的「重合度」或「偏離度」。
       - **請撰寫至少 600 字以上的專業職能分析**，包含對其工作穩定度、專業深度、與長輩溝通潛力的評估。
       - 必須提到管家作為長輩生活夥伴的核心價值。
       - 給予三個具體、可落實的職業成長策略（如：進修證照、轉向管理職、或深化特殊照護技術）。
       - 請確保語氣專業、鼓舞人心且充滿洞察力。

    3. 生成「AI 可以怎麼協助你」(AI Assistance)：
       - 提供 3-5 個具體的 AI 工具應用情境（例如：使用語音轉文字自動生成服務紀錄、利用 AI 規劃個人化健康餐單等）。

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
      if (!text) throw new Error("AI 模型回傳空內容");
      return JSON.parse(text.trim());
    } catch (error: any) {
      console.warn(`嘗試模型 ${modelName} 失敗:`, error);
      if (modelName === MODELS_SEQUENCE[MODELS_SEQUENCE.length - 1]) throw error;
      continue;
    }
  }
};
