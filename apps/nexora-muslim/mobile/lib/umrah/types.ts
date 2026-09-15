export type JourneyStatus = 'locked' | 'current' | 'completed';

export type JourneyStage = {
  id: string;
  title: string;
  description: string;
  status: JourneyStatus;
  progress: number;
  checklistCount: number;
  completedChecklistCount: number;
};

export type UmrahChecklistItem = {
  id: string;
  stageId: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
};

export type UmrahJourney = {
  title: string;
  subtitle: string;
  overallProgress: number;
  currentStageId: string;
  stages: JourneyStage[];
  checklist: UmrahChecklistItem[];
};

export type UmrahJourneyProvider = {
  getJourney(): Promise<UmrahJourney>;
};
