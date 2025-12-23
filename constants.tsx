
import React from 'react';
import { 
  HeartHandshake, 
  Stethoscope, 
  ClipboardCheck, 
  FileText, 
  Settings, 
  Trash2, 
  Dumbbell, 
  Users, 
  Palette, 
  Utensils, 
  Activity, 
  AlertCircle, 
  MessagesSquare, 
  Moon, 
  Coffee, 
  Navigation 
} from 'lucide-react';

export const SKILL_OPTIONS = [
  { id: 'chat', label: '長輩陪伴聊天談心', icon: <HeartHandshake size={18} /> },
  { id: 'medical_escort', label: '陪伴就醫', icon: <Stethoscope size={18} /> },
  { id: 'medication', label: '協助用藥', icon: <ClipboardCheck size={18} /> },
  { id: 'case_record', label: '個案服務紀錄', icon: <FileText size={18} /> },
  { id: 'general_admin', label: '一般型行政任務', icon: <FileText size={18} /> },
  { id: 'mgmt_admin', label: '管理型行政任務', icon: <Settings size={18} /> },
  { id: 'cleaning', label: '房務打掃', icon: <Trash2 size={18} /> },
  { id: 'exercise', label: '身心提升運動', icon: <Dumbbell size={18} /> },
  { id: 'community', label: '社區俱樂部活動', icon: <Users size={18} /> },
  { id: 'handicraft', label: '特別專案手作活動', icon: <Palette size={18} /> },
  { id: 'dining', label: '協助餐點餐廳', icon: <Utensils size={18} /> },
  { id: 'vitals', label: '問安與生理數據量測', icon: <Activity size={18} /> },
  { id: 'emergency', label: '突發狀況解決', icon: <AlertCircle size={18} /> },
  { id: 'social', label: '協助社交', icon: <MessagesSquare size={18} /> },
  { id: 'overnight', label: '陪伴過夜', icon: <Moon size={18} /> },
  { id: 'daily_service', label: '生活服務', icon: <Coffee size={18} /> },
  { id: 'guidance', label: '長輩引導', icon: <Navigation size={18} /> },
];

export const INTEREST_OPTIONS = [
  { id: 'int_cleaning', label: '打掃' },
  { id: 'int_companion', label: '陪伴' },
  { id: 'int_psych', label: '心理支持' },
  { id: 'int_project', label: '專案活動' },
  { id: 'int_admin', label: '行政管理' },
  { id: 'int_transport', label: '交通服務' },
  { id: 'int_lifestyle', label: '生活服務' },
];

export const RADAR_CATEGORIES = [
  { key: 'emotional', label: '情感支持與社交' },
  { key: 'medical', label: '醫藥安全監測' },
  { key: 'admin', label: '行政管理效能' },
  { key: 'living', label: '生活支援實務' },
  { key: 'activity', label: '活動策劃引導' }
];
