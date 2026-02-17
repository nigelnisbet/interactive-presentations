import { v4 as uuidv4 } from 'uuid';
import {
  Session,
  Participant,
  ActivityConfig,
  SlidePosition,
  ActivityResponse,
} from '@interactive-presentations/shared';
import { MemoryStore } from '../storage/memory-store';
import { config } from '../config';

export class SessionManager {
  constructor(private store: MemoryStore) {}

  generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createSession(presentationId: string, presenterId: string): Promise<Session> {
    let code = this.generateSessionCode();

    // Ensure code is unique
    let attempts = 0;
    while ((await this.store.getSessionByCode(code)) && attempts < 10) {
      code = this.generateSessionCode();
      attempts++;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.sessionExpiryHours * 60 * 60 * 1000);

    const session: Session = {
      id: uuidv4(),
      code,
      presentationId,
      presenterId,
      presenterConnectionId: '',
      currentSlide: { indexh: 0, indexv: 0, timestamp: now.getTime() },
      status: 'waiting',
      activities: [],
      participants: new Map(),
      createdAt: now,
      expiresAt,
    };

    await this.store.createSession(session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.store.getSession(sessionId);
  }

  async getSessionByCode(code: string): Promise<Session | null> {
    return this.store.getSessionByCode(code);
  }

  async updateSlidePosition(sessionId: string, slide: SlidePosition): Promise<void> {
    const session = await this.store.getSession(sessionId);
    if (session) {
      session.currentSlide = slide;
      await this.store.updateSession(session);
    }
  }

  async setActivities(sessionId: string, activities: ActivityConfig[]): Promise<void> {
    const session = await this.store.getSession(sessionId);
    if (session) {
      session.activities = activities;
      await this.store.updateSession(session);
    }
  }

  async addParticipant(
    sessionId: string,
    participantId: string,
    name?: string
  ): Promise<Participant | null> {
    const session = await this.store.getSession(sessionId);
    if (!session) return null;

    const participant: Participant = {
      id: participantId,
      sessionId,
      name,
      joinedAt: new Date(),
      isActive: true,
      responses: new Map(),
    };

    await this.store.addParticipant(sessionId, participant);
    return participant;
  }

  async removeParticipant(sessionId: string, participantId: string): Promise<void> {
    await this.store.removeParticipant(sessionId, participantId);
  }

  async addResponse(
    sessionId: string,
    participantId: string,
    activityId: string,
    answer: any
  ): Promise<ActivityResponse | null> {
    const session = await this.store.getSession(sessionId);
    if (!session) return null;

    const participant = session.participants.get(participantId);
    if (!participant) return null;

    // Check if already responded
    if (participant.responses.has(activityId)) {
      return null; // Duplicate response
    }

    const response: ActivityResponse = {
      activityId,
      answer,
      submittedAt: new Date(),
    };

    await this.store.addResponse(sessionId, participantId, response);
    return response;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = await this.store.getSession(sessionId);
    if (session) {
      session.status = 'ended';
      await this.store.updateSession(session);
    }
  }

  async activateSession(sessionId: string): Promise<void> {
    const session = await this.store.getSession(sessionId);
    if (session) {
      session.status = 'active';
      await this.store.updateSession(session);
    }
  }

  getActivityAtSlide(session: Session, slide: SlidePosition): ActivityConfig | null {
    return (
      session.activities.find(
        (a) =>
          a.slidePosition.indexh === slide.indexh && a.slidePosition.indexv === slide.indexv
      ) || null
    );
  }

  async cleanupExpiredSessions(): Promise<number> {
    return this.store.cleanupExpiredSessions();
  }
}
