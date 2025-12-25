
export const SKILL_OPTIONS = [
  // 權重 4 (Q1)
  { id: 'medical_escort', label: '陪伴就醫', weight: 4 },
  { id: 'special_proj', label: '特別專案活動(小旅行、手作、節日活動)', weight: 4 },
  { id: 'emergency', label: '突發狀況處理', weight: 4 },
  { id: 'mgmt_admin', label: '管理型行政任務', weight: 4 },
  { id: 'community_club', label: '社區俱樂部活動(社區型)', weight: 4 },
  { id: 'social_comm', label: '協助社交(社區型)', weight: 4 },
  { id: 'exercise_comm', label: '身心提升運動(社區型)', weight: 4 },
  { id: 'transport', label: '交通接送', weight: 4 },

  // 權重 3 (Q2)
  { id: 'guidance', label: '長輩引導', weight: 3 },
  { id: 'medication', label: '協助用藥', weight: 3 },
  { id: 'overnight', label: '陪伴過夜', weight: 3 },
  { id: 'living_paid', label: '一對一生活陪伴(收費)', weight: 3 },
  { id: 'exercise_ind', label: '身心提升運動(個別型)', weight: 3 },

  // 權重 2 (Q4)
  { id: 'general_admin', label: '一般型行政任務', weight: 2 },
  { id: 'living_free', label: '生活服務(長輩疑難處理，不收費)', weight: 2 },
  { id: 'social_ind', label: '協助社交(個別型)', weight: 2 },

  // 權重 1 (Q3)
  { id: 'daily_chat', label: '長輩陪伴日常關心(無收費)', weight: 1 },
  { id: 'cleaning', label: '房務打掃', weight: 1 },
  { id: 'dining', label: '餐廳協助(前置、餐廳支援、送餐收餐)', weight: 1 },
  { id: 'vitals', label: '問安與生理數據量測', weight: 1 },
  { id: 'record', label: '個案服務紀錄', weight: 1 }
];

export const INTEREST_OPTIONS = [
  { id: 'int_1', label: '居家美學與環境整理' },
  { id: 'int_2', label: '深度陪伴與心靈輔導' },
  { id: 'int_3', label: '生理醫療與健康管理' },
  { id: 'int_4', label: '行政數據與流程規劃' },
  { id: 'int_5', label: '活動策展與創意手作' },
  { id: 'int_6', label: '高齡體智能與運動' }
];

export const RADAR_CATEGORIES = [
  { key: 'emotional', label: '情感支持與社交' },
  { key: 'medical', label: '醫藥安全監測' },
  { key: 'admin', label: '行政管理效能' },
  { key: 'living', label: '生活支援實務' },
  { key: 'activity', label: '活動策劃引導' }
];

export const SKILL_CATEGORIES = [
  { id: 'q1', label: '第一象限', weight: 4 },
  { id: 'q2', label: '第二象限', weight: 3 },
  { id: 'q4', label: '第四象限', weight: 2 },
  { id: 'q3', label: '第三象限', weight: 1 }
];
