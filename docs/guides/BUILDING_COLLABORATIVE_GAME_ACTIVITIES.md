# Building Collaborative Game Activities for Interactive Presentations

This guide documents the specific patterns and considerations for building **collaborative real-time game activities** like the "Who Wants to be a Trillionaire?" tap game.

## What Makes Collaborative Games Different?

Unlike standard activities (polls, quizzes, text responses), collaborative games have unique requirements:

1. **Multiple interactions per participant** - Students can submit many responses (e.g., multiple taps)
2. **Real-time state synchronization** - All participants see the same game state instantly
3. **Teacher-controlled flow** - Teachers can start/stop/reset the game
4. **Shared goal** - All students work together toward a common objective
5. **Immediate feedback** - Changes are visible to everyone instantly

---

## Core Patterns for Collaborative Games

### Pattern 1: Allow Multiple Submissions

**Problem**: By default, `submitResponse()` blocks duplicate submissions from the same participant.

**Solution**: Add an exception in the Firebase Context for your game's response type.

**Location**: `packages/attendee-app/src/contexts/FirebaseContext.tsx` in the `submitResponse` function

```typescript
const submitResponse = useCallback(async (activityId: string, answer: any): Promise<void> => {
  // ... setup code

  const responseRef = ref(database, `sessions/${sessionCode}/responses/${activityId}/${participantId}`);

  // Check if this is a submit-sample activity (allows multiple submissions)
  const isSubmitSample = answer && typeof answer === 'object' && 'imageUrl' in answer && 'version' in answer;

  // Check if this is a collaborative-tap-game tap (allows multiple taps)
  const isTapGame = answer && typeof answer === 'object' && 'action' in answer && answer.action === 'tap';

  // ADD YOUR GAME TYPE HERE
  const isYourGame = answer && typeof answer === 'object' && 'gameAction' in answer;

  // Check for duplicate response (but allow games to submit multiple times)
  if (!isSubmitSample && !isTapGame && !isYourGame) {
    const existingResponse = await get(responseRef);
    if (existingResponse.exists()) {
      throw new Error('Already responded to this activity');
    }
  }

  // ... rest of function
}, [sessionCode, participantId]);
```

**Key**: Identify your game's responses by a unique property (e.g., `{ action: 'tap' }`, `{ gameAction: 'jump' }`)

---

### Pattern 2: Real-Time State Updates with Transactions

**Problem**: Multiple students submitting simultaneously can cause race conditions and lost updates.

**Solution**: Use Firebase transactions to atomically update shared game state.

**Location**: `packages/attendee-app/src/contexts/FirebaseContext.tsx` in the `updateAggregatedResults` function

```typescript
const updateAggregatedResults = useCallback(async (
  code: string,
  activityId: string,
  answer: any
): Promise<void> => {
  const aggregatedRef = ref(database, `sessions/${code}/aggregatedResults/${activityId}`);

  // Get activity config
  const activityRef = ref(database, `sessions/${code}/currentActivity`);
  const activitySnapshot = await get(activityRef);
  const activity = activitySnapshot.val();

  await runTransaction(aggregatedRef, (current) => {
    // Check if this is YOUR game type
    if (answer && typeof answer === 'object' && 'gameAction' in answer) {
      // Initialize if first interaction
      if (!current) {
        return {
          activityId,
          title: activity?.title || 'Game Title',
          gameState: 'waiting',
          score: 0,
          isActive: false,
          // ... other initial state
        };
      }

      // Only process actions if game is active
      if (!current.isActive) {
        return current; // No change if game not started
      }

      // Update game state based on action
      const newState = { ...current };

      if (answer.gameAction === 'jump') {
        newState.score += 10;
      } else if (answer.gameAction === 'collect') {
        newState.itemsCollected = (current.itemsCollected || 0) + 1;
      }

      // Check win/lose conditions
      if (newState.score >= activity?.winCondition) {
        newState.isWinner = true;
        newState.isActive = false; // Auto-stop on win
      }

      return newState;
    }

    // ... handle other activity types
  });
}, []);
```

**Key Points**:
- Use `runTransaction` for atomic updates
- Initialize state on first interaction
- Check `isActive` before processing actions
- Auto-stop game on win/lose conditions
- Return early with unchanged state if game not active

---

### Pattern 3: Teacher Control Interface

**Problem**: Teachers need to control game flow (start/stop/reset) without the game state being initialized.

**Solution**: Initialize game state when teacher first interacts with controls.

**Location**: Your teacher dashboard component (e.g., `CollaborativeTapGameResults.tsx`)

```typescript
const handleStartGame = async () => {
  if (!updateActivity) return;

  try {
    // Initialize results if they don't exist
    if (!results) {
      await updateActivity(activity.activityId || '', {
        activityId: activity.activityId || '',
        title: activity.title,
        gameState: 'playing',
        score: 0,
        isActive: true,
        isWinner: false,
        // ... other initial fields
      });
    } else {
      // Only update the fields you need to change
      await updateActivity(activity.activityId || '', {
        activityId: results.activityId,
        title: results.title,
        gameState: results.gameState,
        score: results.score,
        isActive: !results.isActive, // Toggle
        isWinner: results.isWinner,
        // ... explicitly list ALL fields
      });
    }
  } catch (error) {
    console.error('Error toggling game:', error);
  }
};

const handleReset = async () => {
  if (!results || !updateActivity) return;
  if (!confirm('Reset the game?')) return;

  try {
    // Explicitly map all fields, setting some to defaults
    await updateActivity(activity.activityId || '', {
      activityId: results.activityId,
      title: results.title,
      gameState: 'waiting',
      score: 0,
      isActive: false,
      isWinner: false,
      // ... all other fields
    });
  } catch (error) {
    console.error('Error resetting game:', error);
  }
};
```

**Critical**: NEVER use `...results` spread operator! Firebase rejects undefined fields. Always explicitly list every field.

---

### Pattern 4: Use Session Participant Count

**Problem**: Tracking which participants have interacted adds complexity and doesn't match classroom reality.

**Solution**: Use the session's existing participant count instead of tracking your own.

**Student Component**:
```typescript
export const YourGame: React.FC<YourGameProps> = ({ activity, results }) => {
  const { submitResponse, participantCount: sessionParticipantCount } = useSocket();

  return (
    <div>
      <div>{sessionParticipantCount || 0} participants playing</div>
      {/* ... game UI */}
    </div>
  );
};
```

**Teacher Component**:
```typescript
export const YourGameResults: React.FC<YourGameResultsProps> = ({ activity, results }) => {
  const { updateActivity, participantCount: sessionParticipantCount } = useSocket();

  return (
    <div>
      <div>Active Participants: {sessionParticipantCount || 0}</div>
      {/* ... controls */}
    </div>
  );
};
```

**Why**: The session already tracks all connected participants. Don't duplicate this logic.

---

### Pattern 5: Client-Side Rate Limiting

**Problem**: Students can spam actions if there's no throttling.

**Solution**: Implement client-side cooldowns with visual feedback.

```typescript
export const YourGame: React.FC<YourGameProps> = ({ activity, results }) => {
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(0);
  const cooldownTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const handleAction = async () => {
    if (isOnCooldown || !results?.isActive || results?.isWinner) return;

    try {
      await submitResponse(activity.activityId || '', { gameAction: 'jump' });

      // Start cooldown
      setIsOnCooldown(true);
      setCooldownProgress(0);

      // Animate progress
      const startTime = Date.now();
      const duration = activity.cooldownSeconds * 1000;

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setCooldownProgress(progress);
      }, 16); // ~60fps

      // End cooldown
      cooldownTimerRef.current = window.setTimeout(() => {
        setIsOnCooldown(false);
        setCooldownProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, duration);
    } catch (error) {
      console.error('Error submitting action:', error);
      setIsOnCooldown(false);
      setCooldownProgress(0);
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={isOnCooldown || !results?.isActive || results?.isWinner}
      style={{
        position: 'relative',
        opacity: isOnCooldown ? 0.5 : 1,
        cursor: isOnCooldown ? 'not-allowed' : 'pointer',
      }}
    >
      ACTION
      {/* Visual cooldown overlay */}
      {isOnCooldown && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${cooldownProgress}%`,
          background: 'rgba(0, 0, 0, 0.5)',
        }} />
      )}
    </button>
  );
};
```

**Key Points**:
- Disable button during cooldown
- Show visual progress (fill animation)
- Clean up timers on unmount
- Reset cooldown on errors

---

### Pattern 6: Results Type Definition

Define a strict interface for your game's results in shared types.

**Location**: `packages/shared/src/types/activity.ts`

```typescript
export interface YourGameResults {
  activityId: string;
  title: string;
  gameState: 'waiting' | 'playing' | 'finished';
  score: number;
  isActive: boolean;
  isWinner: boolean;
  // Add game-specific fields
  level?: number;
  itemsCollected?: number;
  timeRemaining?: number;
  // DO NOT include: participantCount (use session count instead)
}
```

**Don't include**:
- `participantCount` - use session count
- `participants` array - unnecessary tracking
- Fields from other activity types

---

## Common Pitfalls and Solutions

### Pitfall 1: Spreading Results Object

**Wrong**:
```typescript
await updateActivity(activityId, {
  ...results,
  isActive: !results.isActive,
});
```

**Why it fails**: `results` may contain `undefined` fields or fields from other activity types. Firebase rejects undefined values.

**Right**:
```typescript
await updateActivity(activityId, {
  activityId: results.activityId,
  title: results.title,
  gameState: results.gameState,
  score: results.score,
  isActive: !results.isActive,
  isWinner: results.isWinner,
  // Explicitly list EVERY field
});
```

**Error you'll see**: `update failed: values argument contains undefined in property 'sessions.XXX.aggregatedResults.YYY.fieldName'`

---

### Pitfall 2: Not Initializing State

**Wrong**:
```typescript
const handleStart = async () => {
  if (!results) return; // Blocks start if not initialized!
  await updateActivity(activityId, { ...results, isActive: true });
};
```

**Why it fails**: Results don't exist until first interaction. Teacher can't start the game.

**Right**:
```typescript
const handleStart = async () => {
  if (!updateActivity) return;

  if (!results) {
    // Initialize on first start
    await updateActivity(activityId, {
      activityId: activity.activityId || '',
      title: activity.title,
      score: 0,
      isActive: true,
      // ... all required fields
    });
  } else {
    // Update existing state
    await updateActivity(activityId, {
      // ... explicitly map all fields
      isActive: !results.isActive,
    });
  }
};
```

---

### Pitfall 3: Blocking Multiple Submissions

**Wrong**: Forgetting to add your game type to the duplicate check exception.

**Symptom**: Students can only interact once, then get "Already responded to this activity" error.

**Solution**: Add your game's response pattern to the `submitResponse` function as shown in Pattern 1.

---

### Pitfall 4: Race Conditions

**Wrong**:
```typescript
// Reading and writing separately
const current = await get(aggregatedRef);
const newScore = current.val().score + 10;
await set(aggregatedRef, { ...current.val(), score: newScore });
```

**Why it fails**: Multiple students submitting at the same time will overwrite each other's updates.

**Right**:
```typescript
// Use transaction for atomic updates
await runTransaction(aggregatedRef, (current) => {
  if (!current) return { score: 10 };
  return { ...current, score: current.score + 10 };
});
```

---

### Pitfall 5: Not Checking isActive

**Wrong**:
```typescript
await runTransaction(aggregatedRef, (current) => {
  if (answer.gameAction === 'tap') {
    return { ...current, score: current.score + 1 };
  }
});
```

**Why it fails**: Students can submit actions even when teacher has stopped the game.

**Right**:
```typescript
await runTransaction(aggregatedRef, (current) => {
  if (answer.gameAction === 'tap') {
    if (!current.isActive) return current; // No change if stopped
    return { ...current, score: current.score + 1 };
  }
});
```

---

## Activity-Specific Configurations

### For Tap/Click Games
```typescript
interface TapGameActivity extends ActivityDefinition {
  type: 'your-tap-game';
  title: string;
  question: string;
  incrementPerTap: number;
  cooldownSeconds: number;
  winCondition: number;
}
```

**Use cases**: Counting games, resource collection, button mashers

---

### For Timed Challenge Games
```typescript
interface TimedGameActivity extends ActivityDefinition {
  type: 'your-timed-game';
  title: string;
  description: string;
  durationSeconds: number;
  targetScore: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
}
```

**Use cases**: Speed challenges, reaction time tests, timed quizzes

---

### For Team Competition Games
```typescript
interface TeamGameActivity extends ActivityDefinition {
  type: 'your-team-game';
  title: string;
  teamCount: number;
  pointsToWin: number;
  roundDuration: number;
  allowTeamSwitch: boolean;
}
```

**Use cases**: Team battles, group challenges, relay races

---

### For Collaborative Puzzle Games
```typescript
interface PuzzleGameActivity extends ActivityDefinition {
  type: 'your-puzzle-game';
  title: string;
  puzzleType: 'jigsaw' | 'logic' | 'sequence';
  difficulty: number;
  piecesTotal: number;
  hintsAllowed: number;
}
```

**Use cases**: Jigsaw puzzles, escape rooms, collaborative problem solving

---

## Testing Checklist for Collaborative Games

- [ ] **Multiple participants can interact simultaneously**
  - Open 3+ browser windows/devices
  - Submit actions from all at once
  - Verify all updates are captured (no lost taps/clicks)

- [ ] **Teacher controls work before any student interaction**
  - Start fresh session
  - Click "Start Game" before any student joins
  - Should initialize properly

- [ ] **Stop/Start flow works correctly**
  - Start game
  - Students can interact
  - Stop game
  - Students cannot interact
  - Restart game
  - Students can interact again

- [ ] **Reset clears all state**
  - Play game for a bit
  - Click reset
  - All counters/scores return to zero
  - Can play again from scratch

- [ ] **Cooldowns work as expected**
  - Click action button
  - Button should be disabled
  - Visual feedback during cooldown
  - Button re-enables after cooldown
  - Can click again

- [ ] **Win condition triggers properly**
  - Play game to completion
  - Winner celebration shows for all participants
  - Game stops automatically
  - Cannot interact after winning

- [ ] **Participant count is accurate**
  - Join from multiple devices
  - Count should match actual participants
  - Count should update when people join/leave

- [ ] **Mode switching works (if applicable)**
  - Switch between modes (e.g., linear/exponential)
  - Game behavior changes correctly
  - State persists across mode changes

- [ ] **Network resilience**
  - Disconnect one participant
  - Reconnect
  - State should sync correctly
  - Other participants unaffected

- [ ] **No undefined field errors**
  - Check browser console
  - Should be no Firebase update errors
  - All state updates successful

---

## Performance Considerations

### 1. Throttle UI Updates
If your game updates very frequently (e.g., score changing every tap), consider throttling UI re-renders:

```typescript
const [displayScore, setDisplayScore] = useState(0);

useEffect(() => {
  // Only update display every 100ms
  const timer = setInterval(() => {
    setDisplayScore(results?.score || 0);
  }, 100);

  return () => clearInterval(timer);
}, [results?.score]);
```

### 2. Minimize Transaction Complexity
Keep transaction logic simple and fast:

```typescript
// Good - fast calculation
await runTransaction(aggregatedRef, (current) => {
  return { ...current, score: current.score + 1 };
});

// Bad - slow calculation in transaction
await runTransaction(aggregatedRef, (current) => {
  const complexCalculation = performExpensiveOperation(current);
  return { ...current, result: complexCalculation };
});
```

### 3. Batch Updates When Possible
If you need to update multiple fields, do it in one transaction:

```typescript
// Good - single transaction
await runTransaction(aggregatedRef, (current) => {
  return {
    ...current,
    score: current.score + 10,
    level: current.level + 1,
    itemsCollected: current.itemsCollected + 1,
  };
});

// Bad - multiple transactions
await runTransaction(aggregatedRef, (current) => ({ ...current, score: current.score + 10 }));
await runTransaction(aggregatedRef, (current) => ({ ...current, level: current.level + 1 }));
await runTransaction(aggregatedRef, (current) => ({ ...current, itemsCollected: current.itemsCollected + 1 }));
```

---

## Mobile-Specific Considerations

### Touch Optimization
```typescript
<button
  onTouchStart={handleAction} // Faster than onClick on mobile
  style={{
    WebkitTapHighlightColor: 'transparent', // Remove tap highlight
    touchAction: 'manipulation', // Prevent double-tap zoom
  }}
>
  TAP
</button>
```

### Viewport Settings
Ensure your activity fills the mobile screen:

```typescript
<div style={{
  minHeight: '-webkit-fill-available', // iOS compatibility
  width: '100vw',
  overflow: 'hidden',
}}>
  {/* Game content */}
</div>
```

### Prevent Scroll During Gameplay
```typescript
useEffect(() => {
  // Prevent scroll on mobile during game
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = '';
  };
}, []);
```

---

## Debugging Tips

### 1. Add Console Logging
```typescript
const handleAction = async () => {
  console.log('[YourGame] Action called', {
    isOnCooldown,
    isActive: results?.isActive,
    isWinner: results?.isWinner,
  });

  if (isOnCooldown) {
    console.log('[YourGame] Blocked by cooldown');
    return;
  }

  try {
    console.log('[YourGame] Submitting action...');
    await submitResponse(activityId, { gameAction: 'jump' });
    console.log('[YourGame] Action submitted successfully');
  } catch (error) {
    console.error('[YourGame] Error:', error);
  }
};
```

### 2. Inspect Firebase State
Open Firebase Console → Realtime Database → sessions/{sessionCode}/aggregatedResults/{activityId}

Check:
- Is state initializing correctly?
- Are fields defined (not null/undefined)?
- Is `isActive` being set properly?
- Are counters incrementing?

### 3. Test Transaction Logic Separately
Create a simple test harness to verify your transaction logic:

```typescript
// In browser console
const testTransaction = async () => {
  const testRef = ref(database, 'test/transaction');
  await set(testRef, { score: 0 });

  // Simulate 10 concurrent updates
  await Promise.all(
    Array.from({ length: 10 }, () =>
      runTransaction(testRef, (current) => ({
        score: (current?.score || 0) + 1,
      }))
    )
  );

  const result = await get(testRef);
  console.log('Final score:', result.val().score); // Should be 10
};
```

---

## Example: Complete Minimal Game

Here's a complete minimal collaborative game to use as a template:

**Activity Definition** (`shared/types/activity.ts`):
```typescript
export interface ClickCounterActivity extends ActivityDefinition {
  type: 'click-counter';
  title: string;
  targetClicks: number;
  cooldownSeconds: number;
}

export interface ClickCounterResults {
  activityId: string;
  title: string;
  totalClicks: number;
  isActive: boolean;
  isWinner: boolean;
}
```

**Student Component**:
```typescript
export const ClickCounter: React.FC<{
  activity: ClickCounterActivity;
  results: ClickCounterResults | null;
}> = ({ activity, results }) => {
  const { submitResponse, participantCount } = useSocket();
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  const handleClick = async () => {
    if (isOnCooldown || !results?.isActive || results?.isWinner) return;

    await submitResponse(activity.activityId || '', { action: 'click' });
    setIsOnCooldown(true);
    setTimeout(() => setIsOnCooldown(false), activity.cooldownSeconds * 1000);
  };

  return (
    <div>
      <h1>{activity.title}</h1>
      <h2>{results?.totalClicks || 0} / {activity.targetClicks}</h2>
      <button onClick={handleClick} disabled={isOnCooldown || !results?.isActive}>
        CLICK
      </button>
      <p>{participantCount} participants</p>
    </div>
  );
};
```

**Teacher Component**:
```typescript
export const ClickCounterResults: React.FC<{
  activity: ClickCounterActivity;
  results: ClickCounterResults | null;
}> = ({ activity, results }) => {
  const { updateActivity, participantCount } = useSocket();

  const handleToggle = async () => {
    if (!updateActivity) return;

    if (!results) {
      await updateActivity(activity.activityId || '', {
        activityId: activity.activityId || '',
        title: activity.title,
        totalClicks: 0,
        isActive: true,
        isWinner: false,
      });
    } else {
      await updateActivity(activity.activityId || '', {
        activityId: results.activityId,
        title: results.title,
        totalClicks: results.totalClicks,
        isActive: !results.isActive,
        isWinner: results.isWinner,
      });
    }
  };

  return (
    <div>
      <h1>{activity.title}</h1>
      <p>Clicks: {results?.totalClicks || 0} / {activity.targetClicks}</p>
      <p>Participants: {participantCount}</p>
      <button onClick={handleToggle}>
        {results?.isActive ? 'Stop' : 'Start'}
      </button>
    </div>
  );
};
```

**Firebase Context** (`updateAggregatedResults`):
```typescript
await runTransaction(aggregatedRef, (current) => {
  if (answer && typeof answer === 'object' && answer.action === 'click') {
    if (!current) {
      return {
        activityId,
        title: activity?.title || 'Click Counter',
        totalClicks: 0,
        isActive: false,
        isWinner: false,
      };
    }

    if (!current.isActive) return current;

    const newClicks = (current.totalClicks || 0) + 1;
    const isWinner = newClicks >= activity?.targetClicks;

    return {
      ...current,
      totalClicks: newClicks,
      isWinner,
      isActive: isWinner ? false : current.isActive,
    };
  }
});
```

**Allow Multiple Submissions** (`submitResponse`):
```typescript
const isClickCounter = answer && typeof answer === 'object' && answer.action === 'click';

if (!isSubmitSample && !isTapGame && !isClickCounter) {
  const existingResponse = await get(responseRef);
  if (existingResponse.exists()) {
    throw new Error('Already responded to this activity');
  }
}
```

---

## Summary Checklist

When building a new collaborative game:

- [ ] Define activity and results types in shared package
- [ ] Add exception for multiple submissions in `submitResponse`
- [ ] Implement transaction logic in `updateAggregatedResults`
- [ ] Create student component with cooldown mechanism
- [ ] Create teacher component with start/stop/reset controls
- [ ] Initialize state on first teacher interaction
- [ ] Use explicit field mapping (no spreading!)
- [ ] Use session participant count
- [ ] Add all integration points from main activity guide
- [ ] Test with multiple participants simultaneously
- [ ] Verify mobile experience
- [ ] Check for Firebase errors in console

---

**Last Updated**: March 12, 2026
**Based On**: "Who Wants to be a Trillionaire?" collaborative tap game
**Companion Guide**: See `ADDING_NEW_ACTIVITY_TYPES.md` for general activity integration steps
