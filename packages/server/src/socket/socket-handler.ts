import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  PresenterEvents,
  AttendeeEvents,
  SessionEvents,
  ErrorEvents,
  PresenterConnectPayload,
  AttendeeJoinPayload,
  SlideChangePayload,
  SubmitResponsePayload,
  SessionData,
  ParticipantData,
} from '@interactive-presentations/shared';
import { SessionManager } from '../services/session-manager';
import { ActivityLoader } from '../services/activity-loader';
import { QRGenerator } from '../services/qr-generator';
import { PollHandler } from '../activities/poll-handler';
import { QuizHandler } from '../activities/quiz-handler';

export class SocketHandler {
  private presenterSockets: Map<string, string> = new Map(); // sessionId -> socketId
  private attendeeSessions: Map<string, string> = new Map(); // socketId -> sessionId

  constructor(
    private io: SocketIOServer,
    private sessionManager: SessionManager,
    private activityLoader: ActivityLoader,
    private qrGenerator: QRGenerator,
    private pollHandler: PollHandler,
    private quizHandler: QuizHandler
  ) {}

  initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      this.setupPresenterEvents(socket);
      this.setupAttendeeEvents(socket);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });

    // Cleanup expired sessions every hour
    setInterval(async () => {
      const cleaned = await this.sessionManager.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired sessions`);
      }
    }, 60 * 60 * 1000);
  }

  private setupPresenterEvents(socket: Socket) {
    socket.on(PresenterEvents.CONNECT, async (payload: PresenterConnectPayload) => {
      try {
        const { presentationId, extensionVersion } = payload;
        console.log(`Presenter connecting for presentation: ${presentationId}`);

        // Create session
        const session = await this.sessionManager.createSession(presentationId, socket.id);
        session.presenterConnectionId = socket.id;
        this.presenterSockets.set(session.id, socket.id);

        // Load activities for this presentation
        const activities = await this.activityLoader.getActivities(presentationId);
        await this.sessionManager.setActivities(session.id, activities);

        // Generate QR code
        const qrCodeUrl = await this.qrGenerator.generateQRCode(session.code);

        // Activate session
        await this.sessionManager.activateSession(session.id);

        // Join presenter to their session room
        socket.join(session.id);

        // Send response
        socket.emit(PresenterEvents.CONNECTED, {
          sessionId: session.id,
          sessionCode: session.code,
          qrCodeUrl,
        });

        console.log(`Session created: ${session.code} (${session.id})`);
      } catch (error) {
        console.error('Error in presenter connect:', error);
        socket.emit(ErrorEvents.ERROR, { error: 'Failed to create session' });
      }
    });

    socket.on(PresenterEvents.SLIDE_CHANGE, async (payload: SlideChangePayload) => {
      try {
        const sessionId = this.getSessionIdByPresenterSocket(socket.id);
        if (!sessionId) {
          socket.emit(ErrorEvents.ERROR, { error: 'No active session' });
          return;
        }

        const { indexh, indexv } = payload;
        const slidePosition = { indexh, indexv, timestamp: Date.now() };

        // Update session
        await this.sessionManager.updateSlidePosition(sessionId, slidePosition);

        const session = await this.sessionManager.getSession(sessionId);
        if (!session) return;

        // Check if there's an activity at this slide
        const activity = this.sessionManager.getActivityAtSlide(session, slidePosition);

        if (activity) {
          // Broadcast activity to attendees
          this.io.to(sessionId).emit(SessionEvents.ACTIVITY_STARTED, {
            activity: activity.config,
          });

          socket.emit(PresenterEvents.SLIDE_ACKNOWLEDGED, {
            hasActivity: true,
            activityId: activity.activityId,
          });

          console.log(`Activity started: ${activity.activityId} at slide ${indexh}-${indexv}`);
        } else {
          // Broadcast slide change (no activity)
          this.io.to(sessionId).emit(SessionEvents.SLIDE_CHANGED, {
            slidePosition,
            hasActivity: false,
          });

          socket.emit(PresenterEvents.SLIDE_ACKNOWLEDGED, {
            hasActivity: false,
          });
        }

        // Send updated stats to presenter
        this.sendSessionStats(socket, session);
      } catch (error) {
        console.error('Error in slide change:', error);
        socket.emit(ErrorEvents.ERROR, { error: 'Failed to process slide change' });
      }
    });

    socket.on(PresenterEvents.END_SESSION, async () => {
      try {
        const sessionId = this.getSessionIdByPresenterSocket(socket.id);
        if (!sessionId) return;

        await this.sessionManager.endSession(sessionId);

        // Notify all attendees
        this.io.to(sessionId).emit(SessionEvents.ENDED, {
          message: 'The presentation has ended. Thank you for participating!',
        });

        // Clean up
        this.presenterSockets.delete(sessionId);
        console.log(`Session ended: ${sessionId}`);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    });
  }

  private setupAttendeeEvents(socket: Socket) {
    socket.on(AttendeeEvents.JOIN, async (payload: AttendeeJoinPayload) => {
      try {
        const { sessionCode, name } = payload;
        console.log(`Attendee joining session: ${sessionCode}`);

        // Find session
        const session = await this.sessionManager.getSessionByCode(sessionCode);
        if (!session) {
          socket.emit(ErrorEvents.INVALID_SESSION, { error: 'Invalid session code' });
          return;
        }

        if (session.status === 'ended') {
          socket.emit(ErrorEvents.INVALID_SESSION, { error: 'Session has ended' });
          return;
        }

        // Add participant
        await this.sessionManager.addParticipant(session.id, socket.id, name);
        this.attendeeSessions.set(socket.id, session.id);

        // Join room
        socket.join(session.id);

        // Convert session data to serializable format
        const sessionData: SessionData = {
          id: session.id,
          code: session.code,
          presentationId: session.presentationId,
          currentSlide: session.currentSlide,
          status: session.status,
          participantCount: session.participants.size,
          createdAt: session.createdAt.toISOString(),
        };

        // Send current state
        socket.emit(AttendeeEvents.JOINED, {
          sessionId: session.id,
          currentState: {
            session: sessionData,
            currentSlide: session.currentSlide,
          },
        });

        // Broadcast participant count update
        this.broadcastParticipantCount(session.id, session.participants.size);

        // Send stats to presenter
        const presenterSocketId = this.presenterSockets.get(session.id);
        if (presenterSocketId) {
          const presenterSocket = this.io.sockets.sockets.get(presenterSocketId);
          if (presenterSocket) {
            this.sendSessionStats(presenterSocket, session);
          }
        }

        console.log(`Attendee joined: ${name || socket.id} in session ${sessionCode}`);
      } catch (error) {
        console.error('Error in attendee join:', error);
        socket.emit(ErrorEvents.ERROR, { error: 'Failed to join session' });
      }
    });

    socket.on(AttendeeEvents.SUBMIT_RESPONSE, async (payload: SubmitResponsePayload) => {
      try {
        const sessionId = this.attendeeSessions.get(socket.id);
        if (!sessionId) {
          socket.emit(ErrorEvents.ERROR, { error: 'Not in a session' });
          return;
        }

        const { activityId, answer } = payload;
        const session = await this.sessionManager.getSession(sessionId);
        if (!session) return;

        // Find activity
        const activity = session.activities.find((a) => a.activityId === activityId);
        if (!activity) {
          socket.emit(ErrorEvents.INVALID_ACTIVITY, { error: 'Activity not found' });
          return;
        }

        // Validate response
        let isValid = false;
        if (activity.config.type === 'poll') {
          isValid = this.pollHandler.validateResponse(answer, activity.config);
        } else if (activity.config.type === 'quiz') {
          isValid = this.quizHandler.validateResponse(answer, activity.config);
        }

        if (!isValid) {
          socket.emit(ErrorEvents.ERROR, { error: 'Invalid response format' });
          return;
        }

        // Add response
        const response = await this.sessionManager.addResponse(
          sessionId,
          socket.id,
          activityId,
          answer
        );

        if (!response) {
          socket.emit(ErrorEvents.DUPLICATE_RESPONSE, {
            error: 'You have already responded to this activity',
          });
          return;
        }

        // Handle quiz scoring
        if (activity.config.type === 'quiz') {
          const isCorrect = this.quizHandler.validateAnswer(answer, activity.config);
          const timeElapsed = response.submittedAt.getTime() - session.currentSlide.timestamp;
          const points = this.quizHandler.calculatePoints(
            activity.config,
            isCorrect,
            timeElapsed
          );

          response.isCorrect = isCorrect;
          response.points = points;

          socket.emit(AttendeeEvents.RESPONSE_ACKNOWLEDGED, {
            isCorrect,
            points,
          });
        } else {
          socket.emit(AttendeeEvents.RESPONSE_ACKNOWLEDGED, {});
        }

        // Aggregate and broadcast results
        const updatedSession = await this.sessionManager.getSession(sessionId);
        if (updatedSession && activity.config.type === 'poll') {
          const pollActivity = activity.config;
          if (pollActivity.showResults === 'live') {
            const results = this.pollHandler.aggregateResults(pollActivity, updatedSession);
            this.io.to(sessionId).emit(SessionEvents.RESULTS_UPDATED, {
              activityId,
              results,
            });
          }
        }

        console.log(`Response submitted for activity ${activityId} by ${socket.id}`);
      } catch (error) {
        console.error('Error in submit response:', error);
        socket.emit(ErrorEvents.ERROR, { error: 'Failed to submit response' });
      }
    });

    socket.on(AttendeeEvents.LEAVE, async () => {
      await this.handleAttendeeLeave(socket);
    });
  }

  private async handleDisconnect(socket: Socket) {
    // Check if it's a presenter
    const sessionId = this.getSessionIdByPresenterSocket(socket.id);
    if (sessionId) {
      console.log(`Presenter disconnected for session ${sessionId}`);
      // You might want to keep the session alive for a grace period
    }

    // Check if it's an attendee
    await this.handleAttendeeLeave(socket);
  }

  private async handleAttendeeLeave(socket: Socket) {
    const sessionId = this.attendeeSessions.get(socket.id);
    if (sessionId) {
      await this.sessionManager.removeParticipant(sessionId, socket.id);
      this.attendeeSessions.delete(socket.id);

      const session = await this.sessionManager.getSession(sessionId);
      if (session) {
        this.broadcastParticipantCount(sessionId, session.participants.size);

        // Update presenter stats
        const presenterSocketId = this.presenterSockets.get(sessionId);
        if (presenterSocketId) {
          const presenterSocket = this.io.sockets.sockets.get(presenterSocketId);
          if (presenterSocket) {
            this.sendSessionStats(presenterSocket, session);
          }
        }
      }

      console.log(`Attendee left session: ${socket.id}`);
    }
  }

  private getSessionIdByPresenterSocket(socketId: string): string | null {
    for (const [sessionId, presenterSocketId] of this.presenterSockets.entries()) {
      if (presenterSocketId === socketId) {
        return sessionId;
      }
    }
    return null;
  }

  private broadcastParticipantCount(sessionId: string, count: number) {
    this.io.to(sessionId).emit(SessionEvents.PARTICIPANT_COUNT, { count });
  }

  private sendSessionStats(socket: Socket, session: any) {
    const participants: ParticipantData[] = Array.from(session.participants.values()).map(
      (p: any) => ({
        id: p.id,
        name: p.name,
        joinedAt: p.joinedAt.toISOString(),
        isActive: p.isActive,
      })
    );

    socket.emit(PresenterEvents.SESSION_STATS, {
      participantCount: session.participants.size,
      activeParticipants: session.participants.size,
      participants,
    });
  }
}
