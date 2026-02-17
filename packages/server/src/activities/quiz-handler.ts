import {
  QuizActivity,
  QuizResults,
  LeaderboardEntry,
  Session,
  ActivityResponse,
} from '@interactive-presentations/shared';

export class QuizHandler {
  validateAnswer(answer: number, activity: QuizActivity): boolean {
    return answer === activity.correctAnswer;
  }

  calculatePoints(
    activity: QuizActivity,
    isCorrect: boolean,
    timeElapsed?: number
  ): number {
    if (!isCorrect) return 0;

    let points = activity.points;

    // Bonus points for speed (if time limit exists)
    if (activity.timeLimit && timeElapsed !== undefined) {
      const timeRatio = 1 - timeElapsed / activity.timeLimit;
      const speedBonus = Math.floor(activity.points * 0.5 * Math.max(0, timeRatio));
      points += speedBonus;
    }

    return points;
  }

  aggregateResults(activity: QuizActivity, session: Session): QuizResults {
    let correctCount = 0;
    let incorrectCount = 0;
    let totalTime = 0;
    let timeCount = 0;
    const leaderboard: LeaderboardEntry[] = [];

    for (const participant of session.participants.values()) {
      const response = participant.responses.get(activity.activityId || '');
      if (response) {
        if (response.isCorrect) {
          correctCount++;
        } else {
          incorrectCount++;
        }

        // Calculate time if available
        const timeElapsed = response.submittedAt.getTime() - session.currentSlide.timestamp;
        if (timeElapsed > 0) {
          totalTime += timeElapsed;
          timeCount++;
        }

        // Add to leaderboard if correct
        if (response.isCorrect) {
          leaderboard.push({
            participantId: participant.id,
            name: participant.name,
            points: response.points || 0,
            correctAnswers: 1,
            timeElapsed: timeElapsed / 1000, // Convert to seconds
          });
        }
      }
    }

    // Sort leaderboard by points (desc), then time (asc)
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.timeElapsed - b.timeElapsed;
    });

    return {
      activityId: activity.activityId || '',
      question: activity.question,
      correctAnswer: activity.correctAnswer,
      correctCount,
      incorrectCount,
      averageTime: timeCount > 0 ? totalTime / timeCount / 1000 : undefined, // seconds
      leaderboard: leaderboard.slice(0, 10), // Top 10
    };
  }

  validateResponse(response: any, activity: QuizActivity): boolean {
    return (
      typeof response === 'number' && response >= 0 && response < activity.options.length
    );
  }
}
