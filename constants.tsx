
export const SKILL_OPTIONS = [
  { id: 'medical_escort', label: '陪伴就醫', weight: 3 },
  { id: 'medical_escort_urgent', label: '陪伴就醫(緊急)', weight: 4 },
  { id: 'overnight', label: '陪伴過夜', weight: 3 },
  { id: 'living_paid', label: '一對一生活陪伴(收費)', weight: 3 },
  { id: 'living_free', label: '生活服務(長輩疑難處理，不收費)', weight: 1 },
  { id: 'daily_chat', label: '長輩陪伴日常關心(無收費)', weight: 1 },
  { id: 'daily_chat_urgent', label: '長輩陪伴日常關心(緊急心理排解)', weight: 2 },
  { id: 'vitals', label: '問安與生理數據量測', weight: 1 },
  { id: 'medication', label: '協助用藥', weight: 3 },
  { id: 'cleaning', label: '房務打掃', weight: 1 },
  { id: 'community_club', label: '社區俱樂部活動(社區型)', weight: 4 },
  { id: 'exercise_comm', label: '身心提升運動(社區型)', weight: 4 },
  { id: 'exercise_ind', label: '身心提升運動(個別型)', weight: 3 },
  { id: 'guidance', label: '長輩引導', weight: 3 },
  { id: 'social_comm_act', label: '社區型社交活動', weight: 4 },
  { id: 'social_group', label: '小團體活動', weight: 2 },
  { id: 'transport', label: '交通接送', weight: 4 },
  { id: 'special_proj', label: '特別專案活動(小旅行、手作、節日活動)', weight: 4 },
  { id: 'emergency_handle', label: '突發事件處理', weight: 4 },
  { id: 'general_admin', label: '一般型行政任務(含家屬溝通與回報)', weight: 2 },
  { id: 'mgmt_admin', label: '管理型行政任務', weight: 4 },
  { id: 'record', label: '個案服務紀錄', weight: 1 },
  { id: 'dining', label: '餐廳協助(前置、餐廳支援、送餐收餐)', weight: 1 }
];

export const RADAR_CATEGORIES = [
  { key: 'emotional', label: '情感支持與社交' },
  { key: 'medical', label: '醫藥安全監測' },
  { key: 'admin', label: '行政管理效能' },
  { key: 'living', label: '生活支援實務' },
  { key: 'activity', label: '活動策劃引導' }
];
