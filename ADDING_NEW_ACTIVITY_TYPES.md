# Adding New Activity Types to Interactive Presentations

This guide documents the complete process for adding a new activity type to the Interactive Presentations system, based on the integration of the `collaborative-tap-game` activity.

## Overview

Adding a new activity type requires changes across multiple files in the monorepo. The system uses TypeScript with strict typing, Firebase Realtime Database for state management, and React for the UI.

**Key Principle**: Every activity type must be explicitly handled in multiple locations. Missing even one location will cause runtime errors or TypeScript compilation failures.

---

## Part A: General Steps for ANY New Activity Type

### 1. Define Types in Shared Package

**File**: `packages/shared/src/types/activity.ts`

This is the single source of truth for activity types across the entire application.

#### Steps:

1. **Add to ActivityType union** (around line 15):
```typescript
export type ActivityType =
  | 'poll'
  | 'quiz'
  | 'text-response'
  | 'web-link'
  | 'review-game'
  | 'submit-sample'
  | 'collaborative-tap-game'  // ADD NEW TYPE HERE
  | 'your-new-type';
```

2. **Create Activity Interface** (define all fields):
```typescript
export interface YourNewActivity extends ActivityDefinition {
  type: 'your-new-type';
  // Add all required fields for this activity
  requiredField: string;
  optionalField?: number;
  // etc.
}
```

3. **Add to Activity union** (around line 120):
```typescript
export type Activity =
  | PollActivity
  | QuizActivity
  | TextResponseActivity
  | WebLinkActivity
  | ReviewGameActivity
  | SubmitSampleActivity
  | CollaborativeTapGameActivity
  | YourNewActivity;  // ADD HERE
```

4. **Create Results Interface** (if activity needs aggregated results):
```typescript
export interface YourNewActivityResults {
  activityId: string;
  // Add fields that will be stored in aggregatedResults
  someMetric: number;
  isActive: boolean;
  // etc.
}
```

5. **Add to ActivityResults union** (around line 160):
```typescript
export type ActivityResults =
  | PollResults
  | QuizResults
  | CollaborativeTapGameResults
  | YourNewActivityResults;  // ADD HERE
```

**Important**: After modifying the shared package, rebuild it:
```bash
npm run build:shared
```

---

### 2. Update ActivityFormFields (Builder UI)

**File**: `packages/attendee-app/src/components/builder/ActivityFormFields.tsx`

#### Steps:

1. **Add to ActivityFormData type** (top of file, around line 8):
```typescript
export type ActivityFormData =
  | PollActivity
  | QuizActivity
  | YourNewActivity  // ADD HERE
  | /* ... other types */;
```

2. **Update getDefaultActivity()** (around line 48):
```typescript
export const getDefaultActivity = (type: ActivityType = 'poll', indexh = 0, indexv = 0): ActivityFormData => {
  if (type === 'your-new-type') {
    return {
      type: 'your-new-type',
      activityId: '',
      slidePosition: { indexh, indexv },
      requiredField: '',
      optionalField: 100,
      // Provide defaults for ALL fields
      // IMPORTANT: Use empty strings, not undefined, for optional string fields
    };
  }
  // ... other types
}
```

3. **Add validation in validateActivity()** (around line 111):
```typescript
export const validateActivity = (activity: ActivityFormData): string | null => {
  // ... other validations

  if ((activity as any).type === 'your-new-type') {
    // Add validation logic
    if (!activity.requiredField?.trim()) {
      return 'Required field is required';
    }
    return null;
  }

  return null;
};
```

**Note**: Use `(activity as any).type` for types not in the standard ActivityFormData union (like library-only activities).

---

### 3. Update Activity Library

**File**: `packages/attendee-app/src/components/builder/ActivityLibrary.tsx`

#### Steps:

1. **Add to LibraryActivity type** (around line 12):
```typescript
export type LibraryActivity = {
  id: string;
  type: 'poll' | 'quiz' | 'text-response' | 'web-link' | 'review-game' | 'submit-sample' | 'collaborative-tap-game' | 'your-new-type';
  // ...
}
```

2. **Add to ACTIVITY_TYPES array** (around line 30):
```typescript
const ACTIVITY_TYPES = [
  { value: 'poll', label: 'Poll', icon: '📊' },
  { value: 'quiz', label: 'Quiz', icon: '❓' },
  // ...
  { value: 'your-new-type', label: 'Your Activity', icon: '🎯' },
] as const;
```

3. **Update generateActivityHash()** (around line 50):
```typescript
const generateActivityHash = (activity: LibraryActivity): string => {
  const parts = [activity.type];

  if (activity.type === 'your-new-type') {
    parts.push(activity.config.requiredField || '');
    parts.push(String(activity.config.optionalField || 0));
  }
  // ... other types

  return parts.join('||');
};
```

4. **Update getPreviewText()** (around line 90):
```typescript
const getPreviewText = (activity: LibraryActivity): string => {
  switch (activity.config.type) {
    case 'your-new-type':
      return activity.config.requiredField || 'No description';
    // ... other cases
  }
};
```

5. **Update getOptionInfo()** (around line 115):
```typescript
const getOptionInfo = (activity: LibraryActivity): string => {
  switch (activity.config.type) {
    case 'your-new-type':
      return 'Your activity type description';
    // ... other cases
  }
};
```

6. **Update saveToLibrary() signature** (around line 200):
```typescript
export const saveToLibrary = async (
  activity:
    | { type: 'poll'; name: string; config: any }
    | { type: 'quiz'; name: string; config: any }
    | { type: 'your-new-type'; name: string; config: any }  // ADD HERE
    // ... other types
  ,
  userId: string,
  isShared: boolean = false,
  existingId?: string
): Promise<string> => {
  // ... implementation
}
```

---

### 4. Update Activity Editor Modal

**File**: `packages/attendee-app/src/components/builder/ActivityEditorModal.tsx`

#### Steps:

1. **Add to libraryFilter type** (around line 36):
```typescript
const [libraryFilter, setLibraryFilter] = useState<'all' | 'poll' | 'quiz' | 'your-new-type' | /* ... */>('all');
```

2. **Add filter option to dropdown** (around line 509):
```typescript
<select value={libraryFilter} onChange={e => setLibraryFilter(e.target.value as any)}>
  <option value="all">All Types</option>
  <option value="poll">Polls</option>
  <option value="your-new-type">Your Activities</option>
  {/* ... */}
</select>
```

3. **Add emoji to library list** (around line 537):
```typescript
<span style={styles.libraryItemType}>
  {a.type === 'poll' && '📊'}
  {a.type === 'your-new-type' && '🎯'}
  {/* ... */}
</span>
```

4. **Add to getPreviewText()** (around line 424):
```typescript
const getPreviewText = (a: LibraryActivity): string => {
  const config = a.config || {};
  switch (a.type) {
    case 'your-new-type':
      return config.requiredField || 'No description';
    // ... other cases
  }
};
```

5. **Handle library selection in handleSelectFromLibrary()** (around line 314):

**CRITICAL**: This is where you map library config to the activity object. You MUST explicitly list every field - do NOT use spread operators with library config, as it may include undefined values that Firebase rejects.

```typescript
const handleSelectFromLibrary = (libActivity: LibraryActivity) => {
  if (libActivity.type === 'your-new-type') {
    const config = libActivity.config || {};
    const newActivity = {
      type: 'your-new-type' as const,
      activityId: `${libActivity.type}-slide${slidePosition.indexh}-${Date.now().toString(36)}`,
      slidePosition: {
        indexh: slidePosition.indexh,
        indexv: slidePosition.indexv,
      },
      sourceLibraryId: libActivity.id,
      copiedFromLibraryAt: Date.now(),
      // EXPLICITLY map each field with fallback values
      requiredField: config.requiredField || '',
      optionalField: config.optionalField || 100,
      // DO NOT use: ...config (may contain undefined values)
    };
    onActivityChange(newActivity as any);
    setMode('create'); // Shows "Add Activity" button
    return;
  }
  // ... handle other types
}
```

---

### 5. Update Slide Thumbnail

**File**: `packages/attendee-app/src/components/builder/SlideThumbnail.tsx`

#### Steps:

1. **Create icon component** (around line 50):
```typescript
const YourNewActivityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    {/* Your SVG path here */}
  </svg>
);
```

2. **Add to activityColors** (around line 100):
```typescript
const activityColors: Record<string, string> = {
  poll: '#3b82f6',
  quiz: '#10b981',
  'your-new-type': '#f59e0b',
  // ...
};
```

3. **Add to getActivityIcon()** (around line 120):
```typescript
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'poll': return <PollIcon />;
    case 'your-new-type': return <YourNewActivityIcon />;
    // ...
  }
};
```

4. **Add to getActivityTitle()** (around line 150):
```typescript
const getActivityTitle = (activity: any): string => {
  switch (activity.type) {
    case 'poll':
    case 'quiz':
      return activity.question || 'Question';
    case 'your-new-type':
      return activity.requiredField || 'Your Activity';
    // ...
  }
};
```

5. **Update activity prop type** (if needed, around line 30):
```typescript
interface SlideThumbnailProps {
  // ...
  activity?: ActivityFormData | { type: 'your-new-type'; requiredField: string; [key: string]: any };
}
```

---

### 6. Update Activity Builder (Serialization)

**File**: `packages/attendee-app/src/pages/ActivityBuilder.tsx`

**CRITICAL**: This is where Firebase save errors occur if not done correctly.

#### Steps:

Add serialization logic in `buildConfigJSON()` (around line 950):

```typescript
const buildConfigJSON = useCallback(() => {
  return {
    presentationId,
    title: presentationTitle,
    tags: presentationTags,
    ownerId: user?.id,
    activities: activities.map(activity => {
      const base: any = {
        activityId: activity.activityId,
        slidePosition: activity.slidePosition,
        activityType: activity.type,
      };

      // Preserve library tracking fields
      if ((activity as any).sourceLibraryId) {
        base.sourceLibraryId = (activity as any).sourceLibraryId;
      }
      if ((activity as any).copiedFromLibraryAt) {
        base.copiedFromLibraryAt = (activity as any).copiedFromLibraryAt;
      }

      // ADD YOUR TYPE HERE (before the final else clause)
      if ((activity as any).type === 'your-new-type') {
        return {
          ...base,
          config: {
            type: 'your-new-type',
            requiredField: (activity as any).requiredField,
            optionalField: (activity as any).optionalField,
            // ONLY include defined fields - no undefined values
          },
        };
      }
      // ... other types
      else {
        // Default case (usually web-link)
      }
    }),
  };
}, [presentationId, presentationTitle, presentationTags, activities, user]);
```

**Common Error**: If you see `Failed to save: value argument contains undefined in property 'presentations.XXX.config.activities.0.config.someField'`, it means:
- Your activity is falling through to the wrong case in buildConfigJSON
- You're including a field with an undefined value
- You need to add a specific case for your activity type

---

### 7. Add Student-Facing Component

**File**: `packages/attendee-app/src/components/activities/YourNewActivity.tsx` (NEW FILE)

Create the React component that students will see:

```typescript
import React from 'react';
import { YourNewActivity as YourNewActivityType } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';

interface YourNewActivityProps {
  activity: YourNewActivityType;
  results: any; // Use your results type
}

export const YourNewActivity: React.FC<YourNewActivityProps> = ({ activity, results }) => {
  const { submitResponse } = useSocket();

  const handleAction = async () => {
    await submitResponse(activity.activityId || '', { /* data */ });
  };

  return (
    <div>
      <h1>{activity.requiredField}</h1>
      {/* Your UI here */}
    </div>
  );
};
```

---

### 8. Add Teacher Dashboard Component

**File**: `packages/attendee-app/src/components/presenter/YourNewActivityResults.tsx` (NEW FILE)

Create the React component that teachers will see:

```typescript
import React from 'react';
import { YourNewActivity, YourNewActivityResults as ResultsType } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';

interface YourNewActivityResultsProps {
  activity: YourNewActivity;
  results: ResultsType | null;
}

export const YourNewActivityResults: React.FC<YourNewActivityResultsProps> = ({ activity, results }) => {
  const { updateActivity } = useSocket();

  const handleControl = async () => {
    if (!updateActivity || !results) return;
    await updateActivity(activity.activityId || '', {
      ...results,
      // Update fields
    });
  };

  return (
    <div>
      <h1>Teacher Controls: {activity.requiredField}</h1>
      {/* Your dashboard UI here */}
    </div>
  );
};
```

---

### 9. Wire Up Routing

**File**: `packages/attendee-app/src/App.tsx`

```typescript
import { YourNewActivity } from './components/activities/YourNewActivity';

// In the routing logic (around line 80):
if (activity.type === 'your-new-type') {
  return <YourNewActivity activity={activity} results={results} />;
}
```

**File**: `packages/attendee-app/src/pages/PresenterDashboard.tsx`

```typescript
import { YourNewActivityResults } from './components/presenter/YourNewActivityResults';

// In title display (around line 200):
if (currentActivity?.config.type === 'your-new-type') {
  title = currentActivity.config.requiredField || 'Your Activity';
}

// In results rendering (around line 300):
if (currentActivity?.config.type === 'your-new-type') {
  return <YourNewActivityResults activity={currentActivity.config} results={results} />;
}
```

---

### 10. Update Firebase Context (Optional)

**File**: `packages/attendee-app/src/contexts/FirebaseContext.tsx`

Only needed if your activity requires:
- Custom aggregation logic
- Real-time state updates
- Special handling of responses

Add logic in `updateAggregatedResults()` (around line 300):

```typescript
if (activity?.type === 'your-new-type') {
  // Handle response aggregation
  const newMetric = current.someMetric ? current.someMetric + 1 : 1;

  await update(aggregatedRef, {
    activityId,
    someMetric: newMetric,
    // ... other fields
  });
}
```

---

## Checklist for Adding a New Activity Type

Use this checklist to ensure you don't miss any steps:

- [ ] 1. Add to ActivityType union in shared/types/activity.ts
- [ ] 2. Create activity interface extending ActivityDefinition
- [ ] 3. Add to Activity union
- [ ] 4. Create results interface (if needed)
- [ ] 5. Add to ActivityResults union (if needed)
- [ ] 6. Rebuild shared package: `npm run build:shared`
- [ ] 7. Add to ActivityFormData type in ActivityFormFields.tsx
- [ ] 8. Add case in getDefaultActivity()
- [ ] 9. Add validation in validateActivity()
- [ ] 10. Add to LibraryActivity type in ActivityLibrary.tsx
- [ ] 11. Add to ACTIVITY_TYPES array with icon
- [ ] 12. Update generateActivityHash()
- [ ] 13. Update getPreviewText() in ActivityLibrary.tsx
- [ ] 14. Update getOptionInfo()
- [ ] 15. Add to saveToLibrary() type signature
- [ ] 16. Add to libraryFilter type in ActivityEditorModal.tsx
- [ ] 17. Add filter dropdown option
- [ ] 18. Add emoji to library list display
- [ ] 19. Add to getPreviewText() in ActivityEditorModal.tsx
- [ ] 20. Add handling in handleSelectFromLibrary() - EXPLICIT FIELD MAPPING
- [ ] 21. Create icon component in SlideThumbnail.tsx
- [ ] 22. Add to activityColors object
- [ ] 23. Add to getActivityIcon() switch
- [ ] 24. Add to getActivityTitle() switch
- [ ] 25. Update activity prop type (if needed)
- [ ] 26. Add serialization case in buildConfigJSON() - BEFORE ELSE CLAUSE
- [ ] 27. Create student component file
- [ ] 28. Create teacher dashboard component file
- [ ] 29. Wire up student routing in App.tsx
- [ ] 30. Wire up teacher routing in PresenterDashboard.tsx
- [ ] 31. Add Firebase Context logic (if needed)
- [ ] 32. Build app: `npm run build:app`
- [ ] 33. Test adding activity from builder
- [ ] 34. Test saving presentation
- [ ] 35. Test running activity in session

---

## Common Errors and Solutions

### Error: "Failed to save: value argument contains undefined in property..."

**Cause**: You're trying to save undefined values to Firebase. This commonly happens when:
- An activity object has leftover properties from a previous activity type
- Fields from one activity type (e.g., `linearIncrement` from collaborative-tap-game) remain on the object when it's changed to another type (e.g., text-response)
- The `buildConfigJSON()` function reads these properties, which are now undefined

**Solutions**:
1. **Filter out undefined values** - In `buildConfigJSON()`, add this before returning the config:
   ```typescript
   const cleanConfig = Object.fromEntries(
     Object.entries(config).filter(([_, value]) => value !== undefined)
   );
   ```
2. Check `buildConfigJSON()` - ensure your activity type has a specific case BEFORE the final else clause
3. In `handleSelectFromLibrary()`, explicitly map each field instead of spreading config
4. Use empty strings `''` or `0` as defaults, never undefined
5. Verify all optional fields have fallback values
6. **Don't spread activity objects** - Build config objects explicitly with only the fields for that type

### Error: TypeScript compilation fails with "Type 'X' is not assignable..."

**Cause**: Activity type not added to a union type.

**Solutions**:
1. Check all union types in shared/types/activity.ts
2. Add type to ActivityFormData in ActivityFormFields.tsx
3. Rebuild shared package before building app

### Error: Activity appears as wrong type (e.g., shows as "poll")

**Cause**: Missing case in buildConfigJSON(), so it falls through to else clause.

**Solution**: Add explicit case for your activity type before the final else clause.

### Error: Activity doesn't appear in library or has no icon

**Cause**: Missing UI updates in ActivityLibrary or ActivityEditorModal.

**Solutions**:
1. Add to ACTIVITY_TYPES array with emoji
2. Add emoji to library list display
3. Add to getPreviewText() function

---

## Build and Test Workflow

1. Make changes to shared package
   ```bash
   cd /Users/mindadmin/Desktop/interactive-presentations
   npm run build:shared
   ```

2. Build attendee app
   ```bash
   npm run build:app
   ```

3. Deploy to Firebase Hosting
   ```bash
   # Upload packages/attendee-app/dist/ to presentations.stmath.com
   ```

4. Test flow:
   - Open Activity Builder
   - Add your activity type
   - Save presentation
   - Start session
   - Join as student
   - Test activity functionality
   - Check teacher dashboard

---

## Tips for Success

1. **Always use explicit field mapping** - Never spread unknown objects into your activity
2. **Provide default values** - Use `||` operator with sensible defaults
3. **Test serialization early** - Try saving the presentation immediately after adding the activity
4. **Check TypeScript errors carefully** - They usually point to missing union type additions
5. **Keep the shared package in sync** - Rebuild after every change
6. **Follow the pattern** - Look at how existing activities like 'review-game' or 'submit-sample' are handled
7. **Use `(activity as any).type`** - For library-only activities not in standard ActivityFormData
8. **Test with Firebase** - Local TypeScript success doesn't guarantee Firebase will accept the data
9. **Filter undefined values** - Always filter out undefined values from config objects before saving to Firebase
10. **Test type switching** - If activities can be changed from one type to another, test that leftover properties don't cause issues

---

## Notes on Library-Only Activities

Some activities (like collaborative-tap-game) are "library-only" - they cannot be created from scratch in the Activity Builder UI, only loaded from the library.

For library-only activities:
- They don't appear in the "Create New" type selector
- They bypass the ActivityFormFields form
- They call `setMode('create')` to show the "Add Activity" button
- They must still be serialized correctly in buildConfigJSON()
- They still need all the same integration points (icons, routing, etc.)

To mark an activity as library-only:
1. Don't add it to the type selector in ActivityFormFields
2. Handle it specially in handleSelectFromLibrary() with early return
3. Seed the initial activity to Firebase library
4. Users can only add it via "Load from Library"

---

## Future Improvements

Consider documenting:
- How to add custom Firebase rules for new activity types
- How to add analytics/tracking for new activity types
- How to add export functionality for new activity types
- Performance considerations for real-time activities
- Mobile-specific considerations for interactive activities

---

**Last Updated**: March 12, 2026
**Based On**: collaborative-tap-game integration
