import { Session, Participant, ActivityResponse } from '@interactive-presentations/shared';

export class MemoryStore {
  private sessions: Map<string, Session> = new Map();
  private sessionsByCode: Map<string, string> = new Map(); // code -> sessionId

  async createSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
    this.sessionsByCode.set(session.code, session.id);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessionByCode(code: string): Promise<Session | null> {
    const sessionId = this.sessionsByCode.get(code);
    if (!sessionId) return null;
    return this.getSession(sessionId);
  }

  async updateSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessionsByCode.delete(session.code);
      this.sessions.delete(sessionId);
    }
  }

  async addParticipant(sessionId: string, participant: Participant): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants.set(participant.id, participant);
      this.sessions.set(sessionId, session);
    }
  }

  async removeParticipant(sessionId: string, participantId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants.delete(participantId);
      this.sessions.set(sessionId, session);
    }
  }

  async addResponse(
    sessionId: string,
    participantId: string,
    response: ActivityResponse
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      const participant = session.participants.get(participantId);
      if (participant) {
        participant.responses.set(response.activityId, response);
      }
    }
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now || session.status === 'ended') {
        await this.deleteSession(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }
}
