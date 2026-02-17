import { SlidePosition, SessionData, ParticipantData } from './session';
import { ActivityDefinition, ActivityResults } from './activity';

// Presenter to Server
export interface PresenterConnectPayload {
  presentationId: string;
  extensionVersion: string;
}

export interface PresenterConnectedPayload {
  sessionId: string;
  sessionCode: string;
  qrCodeUrl: string;
}

export interface SlideChangePayload {
  indexh: number;
  indexv: number;
}

export interface SlideAcknowledgedPayload {
  hasActivity: boolean;
  activityId?: string;
}

export interface StartActivityPayload {
  activityId: string;
}

export interface EndActivityPayload {
  activityId: string;
}

export interface ShowResultsPayload {
  activityId: string;
}

// Attendee to Server
export interface AttendeeJoinPayload {
  sessionCode: string;
  name?: string;
}

export interface AttendeeJoinedPayload {
  sessionId: string;
  currentState: SessionState;
}

export interface SessionState {
  session: SessionData;
  currentSlide: SlidePosition;
  activeActivity?: ActivityDefinition;
}

export interface SubmitResponsePayload {
  activityId: string;
  answer: any;
}

export interface ResponseAcknowledgedPayload {
  isCorrect?: boolean;
  points?: number;
}

// Server to Attendees (Broadcast)
export interface SlideChangedBroadcast {
  slidePosition: SlidePosition;
  hasActivity: boolean;
}

export interface ActivityStartedBroadcast {
  activity: ActivityDefinition;
}

export interface ActivityEndedBroadcast {
  activityId: string;
}

export interface ResultsUpdatedBroadcast {
  activityId: string;
  results: ActivityResults;
}

export interface SessionEndedBroadcast {
  message: string;
}

export interface ParticipantCountBroadcast {
  count: number;
}

// Server to Presenter
export interface SessionStatsPayload {
  participantCount: number;
  activeParticipants: number;
  participants: ParticipantData[];
}

// Error responses
export interface ErrorPayload {
  error: string;
  code?: string;
}

// Socket.IO event names (type-safe)
export const PresenterEvents = {
  CONNECT: 'presenter:connect',
  CONNECTED: 'presenter:connected',
  SLIDE_CHANGE: 'presenter:slide-change',
  SLIDE_ACKNOWLEDGED: 'presenter:slide-acknowledged',
  START_ACTIVITY: 'presenter:start-activity',
  END_ACTIVITY: 'presenter:end-activity',
  SHOW_RESULTS: 'presenter:show-results',
  END_SESSION: 'presenter:end-session',
  SESSION_STATS: 'presenter:session-stats',
} as const;

export const AttendeeEvents = {
  JOIN: 'attendee:join',
  JOINED: 'attendee:joined',
  SUBMIT_RESPONSE: 'attendee:submit-response',
  RESPONSE_ACKNOWLEDGED: 'attendee:response-acknowledged',
  LEAVE: 'attendee:leave',
} as const;

export const SessionEvents = {
  SLIDE_CHANGED: 'session:slide-changed',
  ACTIVITY_STARTED: 'session:activity-started',
  ACTIVITY_ENDED: 'session:activity-ended',
  RESULTS_UPDATED: 'session:results-updated',
  ENDED: 'session:ended',
  PARTICIPANT_COUNT: 'session:participant-count',
} as const;

export const ErrorEvents = {
  ERROR: 'error',
  INVALID_SESSION: 'error:invalid-session',
  INVALID_ACTIVITY: 'error:invalid-activity',
  DUPLICATE_RESPONSE: 'error:duplicate-response',
} as const;
