
export interface TaskEntry {
  name: string;
  hours: number;
}

export interface AssessmentData {
  tasks: TaskEntry[];
  otherTasks: string;
  interests: string[];
  otherInterests: string;
}

export interface AnalysisResult {
  radarData: Array<{
    subject: string;
    A: number;
    fullMark: number;
  }>;
  suitabilityAdvice: string;
  aiAssistance: string;
}
