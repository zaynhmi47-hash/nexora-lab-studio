import type { UmrahJourney, UmrahJourneyProvider } from './types';
import { mockUmrahJourney } from './mockUmrah';

let journeyState: UmrahJourney = cloneJourney(mockUmrahJourney);

function cloneJourney(journey: UmrahJourney): UmrahJourney {
  return {
    ...journey,
    stages: journey.stages.map((stage) => ({ ...stage })),
    checklist: journey.checklist.map((item) => ({ ...item })),
  };
}

function recalculate(journey: UmrahJourney): UmrahJourney {
  const stages = journey.stages.map((stage) => {
    const items = journey.checklist.filter((item) => item.stageId === stage.id);
    const completed = items.filter((item) => item.completed).length;
    return {
      ...stage,
      checklistCount: items.length,
      completedChecklistCount: completed,
      progress: items.length ? completed / items.length : 0,
    };
  });

  const completedTotal = journey.checklist.filter((item) => item.completed).length;
  const currentIndex = stages.findIndex((stage) => stage.id === journey.currentStageId);

  const nextCurrent = stages.find((stage, index) => index > currentIndex && stage.progress < 1);
  const currentStage = stages.find((stage) => stage.id === journey.currentStageId);
  const currentStageCompleted = currentStage ? currentStage.progress >= 1 : false;
  const resolvedCurrentId = currentStageCompleted && nextCurrent ? nextCurrent.id : journey.currentStageId;

  return {
    ...journey,
    stages: stages.map((stage) => ({
      ...stage,
      status: stage.progress >= 1 ? 'completed' : stage.id === resolvedCurrentId ? 'current' : stage.status === 'locked' ? 'locked' : 'locked',
    })),
    currentStageId: resolvedCurrentId,
    overallProgress: journey.checklist.length ? completedTotal / journey.checklist.length : 0,
  };
}

export const mockUmrahRepository = {
  async getJourney(): Promise<UmrahJourney> {
    return cloneJourney(journeyState);
  },

  async toggleChecklist(itemId: string): Promise<UmrahJourney> {
    journeyState = recalculate({
      ...journeyState,
      checklist: journeyState.checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    });
    return cloneJourney(journeyState);
  },

  async reset(): Promise<UmrahJourney> {
    journeyState = cloneJourney(mockUmrahJourney);
    return cloneJourney(journeyState);
  },
};

export const mockUmrahProvider: UmrahJourneyProvider = {
  async getJourney() {
    return cloneJourney(journeyState);
  },
};
