import {
  PollActivity,
  PollResults,
  ActivityResponse,
  Session,
} from '@interactive-presentations/shared';

export class PollHandler {
  aggregateResults(activity: PollActivity, session: Session): PollResults {
    const responses = Array(activity.options.length).fill(0);
    let totalResponses = 0;

    for (const participant of session.participants.values()) {
      const response = participant.responses.get(activity.activityId || '');
      if (response) {
        const answer = response.answer;
        if (activity.allowMultiple && Array.isArray(answer)) {
          // Multiple selection
          answer.forEach((index: number) => {
            if (index >= 0 && index < activity.options.length) {
              responses[index]++;
            }
          });
          totalResponses++;
        } else if (typeof answer === 'number') {
          // Single selection
          if (answer >= 0 && answer < activity.options.length) {
            responses[answer]++;
          }
          totalResponses++;
        }
      }
    }

    return {
      activityId: activity.activityId || '',
      question: activity.question,
      options: activity.options,
      responses,
      totalResponses,
    };
  }

  validateResponse(response: any, activity: PollActivity): boolean {
    if (activity.allowMultiple) {
      if (!Array.isArray(response)) return false;
      return response.every(
        (idx) => typeof idx === 'number' && idx >= 0 && idx < activity.options.length
      );
    } else {
      return (
        typeof response === 'number' && response >= 0 && response < activity.options.length
      );
    }
  }
}
