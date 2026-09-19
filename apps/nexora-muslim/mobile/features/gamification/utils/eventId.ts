export function createGamificationEventId(
  eventType: string,
  activityId: string,
  attemptId?: string,
): string {
  const suffix = attemptId ? `:${attemptId}` : "";
  return `${eventType}:${activityId}${suffix}`;
}
