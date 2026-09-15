import type { UmrahJourney } from './types';

export const mockUmrahJourney: UmrahJourney = {
  title: 'Umrah Journey',
  subtitle: 'Learn, prepare, and travel with a structured checklist.',
  overallProgress: 0.36,
  currentStageId: 'prepare',
  stages: [
    {
      id: 'learn',
      title: 'Learn the basics',
      description: 'Understand the meaning, sequence, and key terms of Umrah.',
      status: 'completed',
      progress: 1,
      checklistCount: 3,
      completedChecklistCount: 3,
    },
    {
      id: 'prepare',
      title: 'Prepare for Umrah',
      description: 'Organize documents, health preparation, packing, and practical needs.',
      status: 'current',
      progress: 0.5,
      checklistCount: 4,
      completedChecklistCount: 2,
    },
    {
      id: 'travel',
      title: 'Travel readiness',
      description: 'Review travel details, itinerary, essential contacts, and partner information.',
      status: 'locked',
      progress: 0,
      checklistCount: 3,
      completedChecklistCount: 0,
    },
    {
      id: 'journey',
      title: 'Umrah journey mode',
      description: 'Use contextual guidance and checklists during the journey.',
      status: 'locked',
      progress: 0,
      checklistCount: 3,
      completedChecklistCount: 0,
    },
    {
      id: 'continue',
      title: 'Continue learning',
      description: 'Keep learning and building consistent practice after returning home.',
      status: 'locked',
      progress: 0,
      checklistCount: 2,
      completedChecklistCount: 0,
    },
  ],
  checklist: [
    { id: 'passport', stageId: 'prepare', title: 'Check passport validity', description: 'Confirm your travel document meets the requirements for your planned trip.', completed: true, required: true },
    { id: 'health', stageId: 'prepare', title: 'Review health preparation', description: 'Review current official health and travel requirements before departure.', completed: true, required: true },
    { id: 'packing', stageId: 'prepare', title: 'Prepare essential items', description: 'Create a personal packing list for clothing, medication, documents, and daily needs.', completed: false, required: false },
    { id: 'contacts', stageId: 'prepare', title: 'Save emergency contacts', description: 'Keep important travel, accommodation, and emergency contacts available offline.', completed: false, required: true },
    { id: 'sequence', stageId: 'learn', title: 'Learn the Umrah sequence', description: 'Review the general sequence before traveling.', completed: true, required: true },
    { id: 'miqat', stageId: 'learn', title: 'Understand miqat basics', description: 'Learn the concept and review guidance from qualified sources.', completed: true, required: true },
    { id: 'ihram', stageId: 'learn', title: 'Review ihram basics', description: 'Review preparation and restrictions from a trusted source.', completed: true, required: true },
    { id: 'itinerary', stageId: 'travel', title: 'Review itinerary', description: 'Keep transport and accommodation details accessible.', completed: false, required: true },
    { id: 'partner', stageId: 'travel', title: 'Verify travel partner', description: 'Review the provider and official travel documentation before payment or booking.', completed: false, required: true },
    { id: 'offline', stageId: 'travel', title: 'Prepare offline access', description: 'Save key information for situations with limited connectivity.', completed: false, required: false },
    { id: 'mode', stageId: 'journey', title: 'Activate journey mode', description: 'Enable contextual tools when your trip begins.', completed: false, required: false },
    { id: 'checkpoints', stageId: 'journey', title: 'Follow journey checkpoints', description: 'Use checklists alongside guidance from your qualified religious and travel authorities.', completed: false, required: false },
    { id: 'return', stageId: 'journey', title: 'Record return details', description: 'Keep your journey records organized after completing the trip.', completed: false, required: false },
    { id: 'reflection', stageId: 'continue', title: 'Continue learning', description: 'Choose a learning path to continue after Umrah.', completed: false, required: false },
    { id: 'consistency', stageId: 'continue', title: 'Build consistency', description: 'Set sustainable personal learning and worship routines.', completed: false, required: false },
  ],
};

export const mockUmrahProvider = {
  async getJourney() {
    return mockUmrahJourney;
  },
};
