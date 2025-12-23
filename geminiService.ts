
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentData } from "./types";

export const getSuitabilityAnalysis = async (data: AssessmentData) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
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
       - **絕對不要**提供其他職業名稱或職稱。
       - 應側重說明該管家展現出的核心能力價值。
       - 必須包含具體的「自我成長方向」建議。
    3. 生成「AI 可以怎麼協助你」(AI Assistance)：
       - 必須以「列表 (List)」方式呈現。
       - 針對填寫者感興趣的項目或執行任務，提出具體的 AI 協助方式（例如：自動化工具、提示詞應用、內容生成等）。
       - 推薦對應的 AI 工具名稱（如 ChatGPT, Midjourney, Notion AI 等）。

    請以 JSON 格式回覆。
  `;

  const response = await ai.models.generateContent({
    model,
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
  if (!text) {
    throw new Error("AI 模型未回傳任何內容");
  }

  return JSON.parse(text);
};
