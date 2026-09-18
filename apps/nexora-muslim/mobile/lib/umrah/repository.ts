import type { AuthSession } from '../auth/types';
import { env } from '../config/env';
import { mockUmrahJourney } from './mockUmrah';
import type { UmrahJourney, UmrahJourneyProvider } from './types';

const baseUrl = () => `${env.nexoraCoreUrl.replace(/\/$/, '')}/api/v1/umrah`;

async function request<T>(session: AuthSession, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Nexora Core Umrah request failed (${response.status}).`);
  return (await response.json()) as T;
}

export const nexoraCoreUmrahRepository = (session: AuthSession) => ({
  getJourney: () => request<UmrahJourney>(session, '/'),
  toggleChecklist: (itemId: string) =>
    request<UmrahJourney>(session, `/checklist/${encodeURIComponent(itemId)}/toggle/`, { method: 'POST' }),
});

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
  const resolvedCurrentId = currentStage?.progress >= 1 && nextCurrent ? nextCurrent.id : journey.currentStageId;

  return {
    ...journey,
    stages: stages.map((stage) => ({
      ...stage,
      status: stage.progress >= 1 ? 'completed' : stage.id === resolvedCurrentId ? 'current' : 'locked',
    })),
    currentStageId: resolvedCurrentId,
    overallProgress: journey.checklist.length ? completedTotal / journey.checklist.length : 0,
  };
}

export const mockUmrahRepository = {
  async getJourney() { return cloneJourney(journeyState); },
  async toggleChecklist(itemId: string) {
    journeyState = recalculate({
      ...journeyState,
      checklist: journeyState.checklist.map((item) => item.id === itemId ? { ...item, completed: !item.completed } : item),
    });
    return cloneJourney(journeyState);
  },
  async reset() {
    journeyState = cloneJourney(mockUmrahJourney);
    return cloneJourney(journeyState);
  },
};

export const mockUmrahProvider: UmrahJourneyProvider = {
  async getJourney() { return cloneJourney(journeyState); },
};
