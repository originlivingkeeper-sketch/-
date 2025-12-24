
import React from 'react';
import { 
  HeartHandshake, Stethoscope, ClipboardCheck, FileText, Settings, Trash2, 
  Dumbbell, Users, Palette, Utensils, Activity, AlertCircle, MessagesSquare, 
  Moon, Coffee, Navigation 
} from 'lucide-react';

export const SKILL_OPTIONS = [
  { id: 'chat', label: '長輩陪伴聊天談心' },
  { id: 'medical_escort', label: '陪伴就醫' },
  { id: 'medication', label: '協助用藥' },
  { id: 'case_record', label: '個案服務紀錄' },
  { id: 'general_admin', label: '一般型行政任務' },
  { id: 'mgmt_admin', label: '管理型行政任務' },
  { id: 'cleaning', label: '房務打掃' },
  { id: 'exercise', label: '身心提升運動' },
  { id: 'community', label: '社區俱樂部活動' },
  { id: 'handicraft', label: '特別專案手作活動' },
  { id: 'dining', label: '協助餐點餐廳' },
  { id: 'vitals', label: '問安與生理數據量測' },
  { id: 'emergency', label: '突發狀況解決' },
  { id: 'social', label: '協助社交' },
  { id: 'overnight', label: '陪伴過夜' },
  { id: 'daily_service', label: '生活服務' },
  { id: 'guidance', label: '長輩引導' },
];

export const INTEREST_OPTIONS = [
  { id: 'int_clean', label: '居家環境整理' },
  { id: 'int_talk', label: '與人交流互動' },
  { id: 'int_health', label: '健康與醫療照護' },
  { id: 'int_logic', label: '流程規劃與行政' },
  { id: 'int_creative', label: '手作與創意活動' },
  { id: 'int_tech', label: '科技工具應用' }
];

export const RADAR_CATEGORIES = [
  { key: 'emotional', label: '情感支持與社交' },
  { key: 'medical', label: '醫藥安全監測' },
  { key: 'admin', label: '行政管理效能' },
  { key: 'living', label: '生活支援實務' },
  { key: 'activity', label: '活動策劃引導' }
];
