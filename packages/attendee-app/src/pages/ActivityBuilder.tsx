import React, { useState, useCallback } from 'react';
import { ref, set, get } from 'firebase/database';
import {
  LandingPage,
  SlideArranger,
  ActivityEditorModal,
  ActivityFormData,
  getDefaultActivity,
  database,
} from '../components/builder';

type ViewState = 'landing' | 'arranger';

export const ActivityBuilder: React.FC = () => {
  // View state
  const [view, setView] = useState<ViewState>('landing');

  // Presentation state
  const [presentationId, setPresentationId] = useState('');
  const [horizontalCount, setHorizontalCount] = useState(0);
  const [verticalCounts, setVerticalCounts] = useState<Map<number, number>>(new Map());
  const [activities, setActivities] = useState<ActivityFormData[]>([]);
  const [originalActivities, setOriginalActivities] = useState<ActivityFormData[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<{ indexh: number; indexv: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<ActivityFormData>(getDefaultActivity());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Derive slide structure from activities
  const deriveSlideStructure = useCallback((acts: ActivityFormData[], defaultHCount = 10) => {
    let maxH = defaultHCount - 1; // 0-indexed
    const vCounts = new Map<number, number>();

    acts.forEach(a => {
      maxH = Math.max(maxH, a.slidePosition.indexh);
      const currentV = vCounts.get(a.slidePosition.indexh) || 1;
      vCounts.set(a.slidePosition.indexh, Math.max(currentV, a.slidePosition.indexv + 1));
    });

    // Ensure all horizontal slides have at least 1 vertical
    for (let i = 0; i <= maxH; i++) {
      if (!vCounts.has(i)) {
        vCounts.set(i, 1);
      }
    }

    return { horizontal: maxH + 1, vertical: vCounts };
  }, []);

  // Load presentation from Firebase
  const handleLoadPresentation = useCallback(async (id: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const configRef = ref(database, `presentations/${id}/config`);
      const snapshot = await get(configRef);

      let loadedActivities: ActivityFormData[] = [];

      if (snapshot.exists()) {
        const config = snapshot.val();
        loadedActivities = (config.activities || []).map((act: any) => ({
          type: act.config?.type || act.activityType || 'poll',
          activityId: act.activityId,
          slidePosition: act.slidePosition,
          question: act.config?.question,
          options: act.config?.options,
          showResults: act.config?.showResults || 'live',
          correctAnswer: act.config?.correctAnswer,
          timeLimit: act.config?.timeLimit,
          title: act.config?.title,
          description: act.config?.description,
          url: act.config?.url,
          displayMode: act.config?.displayMode || 'iframe',
          fullScreen: act.config?.fullScreen || false,
        }));
      }

      const structure = deriveSlideStructure(loadedActivities);

      setPresentationId(id);
      setActivities(loadedActivities);
      setOriginalActivities(JSON.parse(JSON.stringify(loadedActivities)));
      setHorizontalCount(structure.horizontal);
      setVerticalCounts(structure.vertical);
      setView('arranger');

      if (loadedActivities.length > 0) {
        setMessage({ type: 'success', text: `Loaded ${loadedActivities.length} activities` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to load: ${(error as Error).message}` });
    } finally {
      setLoading(false);
    }
  }, [deriveSlideStructure]);

  // Create new presentation
  const handleCreateNew = useCallback((id: string, slideCount: number) => {
    const structure = deriveSlideStructure([], slideCount);

    setPresentationId(id);
    setActivities([]);
    setOriginalActivities([]);
    setHorizontalCount(structure.horizontal);
    setVerticalCounts(structure.vertical);
    setView('arranger');
    setMessage({ type: 'success', text: `Created new presentation with ${slideCount} slides` });
  }, [deriveSlideStructure]);

  // Get activity at position
  const getActivityAt = useCallback((indexh: number, indexv: number) => {
    return activities.find(
      a => a.slidePosition.indexh === indexh && a.slidePosition.indexv === indexv
    );
  }, [activities]);

  // Handle slide click
  const handleSlideClick = useCallback((indexh: number, indexv: number) => {
    const existing = getActivityAt(indexh, indexv);
    setSelectedSlide({ indexh, indexv });

    if (existing) {
      setCurrentActivity({ ...existing });
    } else {
      setCurrentActivity(getDefaultActivity('poll', indexh, indexv));
    }

    setIsModalOpen(true);
  }, [getActivityAt]);

  // Handle add horizontal slide
  const handleAddHorizontal = useCallback(() => {
    setHorizontalCount(prev => prev + 1);
    const newCounts = new Map(verticalCounts);
    newCounts.set(horizontalCount, 1);
    setVerticalCounts(newCounts);
  }, [horizontalCount, verticalCounts]);

  // Handle add vertical slide
  const handleAddVertical = useCallback((indexh: number) => {
    const newCounts = new Map(verticalCounts);
    const current = newCounts.get(indexh) || 1;
    newCounts.set(indexh, current + 1);
    setVerticalCounts(newCounts);
  }, [verticalCounts]);

  // Handle save activity
  const handleSaveActivity = useCallback(() => {
    if (!selectedSlide) return;

    // Auto-generate activity ID if needed
    let activityToSave = { ...currentActivity };
    if (!activityToSave.activityId.trim()) {
      activityToSave.activityId = `${activityToSave.type}-slide${selectedSlide.indexh}-${Date.now().toString(36)}`;
    }

    // Update slide position to match selected slide
    activityToSave.slidePosition = { ...selectedSlide };

    // Check if updating existing or adding new
    const existingIndex = activities.findIndex(
      a => a.slidePosition.indexh === selectedSlide.indexh &&
           a.slidePosition.indexv === selectedSlide.indexv
    );

    if (existingIndex >= 0) {
      const newActivities = [...activities];
      newActivities[existingIndex] = activityToSave;
      setActivities(newActivities);
    } else {
      setActivities([...activities, activityToSave]);
    }

    setIsModalOpen(false);
    setSelectedSlide(null);
  }, [selectedSlide, currentActivity, activities]);

  // Handle delete activity
  const handleDeleteActivity = useCallback(() => {
    if (!selectedSlide) return;

    setActivities(activities.filter(
      a => !(a.slidePosition.indexh === selectedSlide.indexh &&
             a.slidePosition.indexv === selectedSlide.indexv)
    ));

    setIsModalOpen(false);
    setSelectedSlide(null);
  }, [selectedSlide, activities]);

  // Handle close modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSlide(null);
  }, []);

  // Build config JSON
  const buildConfigJSON = useCallback(() => {
    return {
      presentationId,
      activities: activities.map(activity => {
        const base = {
          activityId: activity.activityId,
          slidePosition: activity.slidePosition,
          activityType: activity.type,
        };

        if (activity.type === 'poll') {
          return {
            ...base,
            config: {
              type: 'poll',
              question: activity.question,
              options: activity.options,
              showResults: activity.showResults,
            },
          };
        } else if (activity.type === 'quiz') {
          return {
            ...base,
            config: {
              type: 'quiz',
              question: activity.question,
              options: activity.options,
              correctAnswer: activity.correctAnswer,
              timeLimit: activity.timeLimit,
              showResults: activity.showResults,
              points: 100,
            },
          };
        } else {
          return {
            ...base,
            config: {
              type: 'web-link',
              title: activity.title,
              description: activity.description,
              url: activity.url,
              displayMode: activity.displayMode,
              fullScreen: activity.fullScreen,
            },
          };
        }
      }),
    };
  }, [presentationId, activities]);

  // Handle save to Firebase
  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage(null);

    try {
      const config = buildConfigJSON();
      const configRef = ref(database, `presentations/${presentationId}/config`);
      await set(configRef, config);
      setOriginalActivities(JSON.parse(JSON.stringify(activities)));
      setMessage({ type: 'success', text: `Saved ${activities.length} activities!` });
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save: ${(error as Error).message}` });
    } finally {
      setSaving(false);
    }
  }, [buildConfigJSON, presentationId, activities]);

  // Handle back to landing
  const handleBack = useCallback(() => {
    const hasChanges = JSON.stringify(activities) !== JSON.stringify(originalActivities);
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to go back?')) {
        return;
      }
    }
    setView('landing');
    setPresentationId('');
    setActivities([]);
    setOriginalActivities([]);
    setHorizontalCount(0);
    setVerticalCounts(new Map());
    setMessage(null);
  }, [activities, originalActivities]);

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(activities) !== JSON.stringify(originalActivities);

  // Clear message after 5 seconds
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      {/* Toast Message */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          padding: '12px 24px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {message.text}
        </div>
      )}

      {view === 'landing' && (
        <LandingPage
          onLoadPresentation={handleLoadPresentation}
          onCreateNew={handleCreateNew}
          loading={loading}
        />
      )}

      {view === 'arranger' && (
        <SlideArranger
          presentationId={presentationId}
          horizontalCount={horizontalCount}
          verticalCounts={verticalCounts}
          activities={activities}
          selectedSlide={selectedSlide}
          onSlideClick={handleSlideClick}
          onAddHorizontal={handleAddHorizontal}
          onAddVertical={handleAddVertical}
          onSave={handleSave}
          onBack={handleBack}
          saving={saving}
          hasChanges={hasChanges}
        />
      )}

      <ActivityEditorModal
        isOpen={isModalOpen}
        slidePosition={selectedSlide || { indexh: 0, indexv: 0 }}
        existingActivity={selectedSlide ? getActivityAt(selectedSlide.indexh, selectedSlide.indexv) : undefined}
        activity={currentActivity}
        onActivityChange={setCurrentActivity}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
        onClose={handleCloseModal}
      />
    </>
  );
};
