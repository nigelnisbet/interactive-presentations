import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALHOftrFMc8iELsW5BRzT6fUz_qofRSuw",
  authDomain: "class-session-games.firebaseapp.com",
  databaseURL: "https://class-session-games-default-rtdb.firebaseio.com",
  projectId: "class-session-games",
  storageBucket: "class-session-games.firebasestorage.app",
  messagingSenderId: "528175934275",
  appId: "1:528175934275:web:1c10fb554988405f639df6"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

type ActivityType = 'poll' | 'quiz' | 'web-link';

type ActivityFormData = {
  type: ActivityType;
  activityId: string;
  slidePosition: { indexh: number; indexv: number };

  // Poll/Quiz fields
  question?: string;
  options?: string[];
  showResults?: 'live' | 'end' | 'never';

  // Quiz-specific
  correctAnswer?: number;
  timeLimit?: number;

  // Web-link specific
  title?: string;
  description?: string;
  url?: string;
  displayMode?: 'iframe' | 'new-tab' | 'redirect';
  fullScreen?: boolean;
};

// Parse presentation ID from URL or return as-is if it's just an ID
const parsePresentationId = (input: string): string => {
  const trimmed = input.trim();

  // Check if it's a URL containing /d/
  const dMatch = trimmed.match(/\/d\/([^\/]+)/);
  if (dMatch) {
    return dMatch[1];
  }

  // Check if it's a slides.com URL without /d/ (e.g., slides.com/username/presentation)
  if (trimmed.includes('slides.com')) {
    const parts = trimmed.split('/').filter(p => p && !p.includes('slides.com') && p !== 'https:' && p !== 'http:');
    if (parts.length > 0) {
      // Return the last meaningful part (presentation name/id)
      return parts[parts.length - 1].split('?')[0].split('#')[0];
    }
  }

  // Otherwise assume it's already just the ID
  return trimmed;
};

export const ActivityBuilder: React.FC = () => {
  const [presentationInput, setPresentationInput] = useState('');
  const [presentationId, setPresentationId] = useState('');
  const [activities, setActivities] = useState<ActivityFormData[]>([]);
  const [currentActivity, setCurrentActivity] = useState<ActivityFormData>({
    type: 'poll',
    activityId: '',
    slidePosition: { indexh: 0, indexv: 0 },
    question: '',
    options: ['', '', '', ''],
    showResults: 'live',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Load activities when presentation ID changes
  const handleLoadPresentation = async () => {
    const parsedId = parsePresentationId(presentationInput);
    if (!parsedId) {
      setMessage({ type: 'error', text: 'Please enter a presentation ID or URL' });
      return;
    }

    setPresentationId(parsedId);
    setLoading(true);
    setMessage(null);

    try {
      const configRef = ref(database, `presentations/${parsedId}/config`);
      const snapshot = await get(configRef);

      if (snapshot.exists()) {
        const config = snapshot.val();
        const loadedActivities = (config.activities || []).map((act: any) => ({
          type: act.config?.type || act.activityType || 'poll',
          activityId: act.activityId,
          slidePosition: act.slidePosition,
          // Poll/Quiz fields
          question: act.config?.question,
          options: act.config?.options,
          showResults: act.config?.showResults || 'live',
          correctAnswer: act.config?.correctAnswer,
          timeLimit: act.config?.timeLimit,
          // Web-link fields
          title: act.config?.title,
          description: act.config?.description,
          url: act.config?.url,
          displayMode: act.config?.displayMode || 'iframe',
          fullScreen: act.config?.fullScreen || false,
        }));
        setActivities(loadedActivities);
        setMessage({ type: 'success', text: `Loaded ${loadedActivities.length} activities` });
      } else {
        setActivities([]);
        setMessage({ type: 'success', text: 'No existing activities found. Starting fresh!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to load: ${(error as Error).message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: ActivityType) => {
    if (type === 'poll' || type === 'quiz') {
      setCurrentActivity({
        type,
        activityId: currentActivity.activityId,
        slidePosition: currentActivity.slidePosition,
        question: '',
        options: ['', '', '', ''],
        showResults: 'live',
        ...(type === 'quiz' ? { correctAnswer: 0, timeLimit: 30 } : {}),
      });
    } else if (type === 'web-link') {
      setCurrentActivity({
        type,
        activityId: currentActivity.activityId,
        slidePosition: currentActivity.slidePosition,
        title: '',
        description: '',
        url: '',
        displayMode: 'iframe',
        fullScreen: false,
      });
    }
  };

  const handleAddOption = () => {
    if (currentActivity.options) {
      setCurrentActivity({
        ...currentActivity,
        options: [...currentActivity.options, ''],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (currentActivity.options && currentActivity.options.length > 2) {
      setCurrentActivity({
        ...currentActivity,
        options: currentActivity.options.filter((_, i) => i !== index),
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (currentActivity.options) {
      const newOptions = [...currentActivity.options];
      newOptions[index] = value;
      setCurrentActivity({ ...currentActivity, options: newOptions });
    }
  };

  const validateActivity = (): string | null => {
    if (!currentActivity.activityId.trim()) return 'Activity ID is required';

    if (currentActivity.type === 'poll' || currentActivity.type === 'quiz') {
      if (!currentActivity.question?.trim()) return 'Question is required';
      if (!currentActivity.options?.length || currentActivity.options.length < 2) {
        return 'At least 2 options are required';
      }
      if (currentActivity.options.some(opt => !opt.trim())) {
        return 'All options must have text';
      }
      if (currentActivity.type === 'quiz') {
        if (currentActivity.correctAnswer === undefined ||
            currentActivity.correctAnswer < 0 ||
            currentActivity.correctAnswer >= currentActivity.options.length) {
          return 'Valid correct answer must be selected';
        }
      }
    } else if (currentActivity.type === 'web-link') {
      if (!currentActivity.title?.trim()) return 'Title is required';
      if (!currentActivity.url?.trim()) return 'URL is required';
      try {
        new URL(currentActivity.url);
      } catch {
        return 'Please enter a valid URL';
      }
    }

    return null;
  };

  const handleAddActivity = () => {
    // Auto-generate activity ID if not provided
    let activityToAdd = { ...currentActivity };
    if (!activityToAdd.activityId.trim()) {
      const slideNum = activityToAdd.slidePosition.indexh;
      activityToAdd.activityId = `${activityToAdd.type}-slide${slideNum}-${Date.now().toString(36)}`;
    }

    // Validate with the potentially auto-generated ID
    const tempActivity = currentActivity;
    setCurrentActivity(activityToAdd);
    const error = validateActivity();
    if (error && error !== 'Activity ID is required') {
      setCurrentActivity(tempActivity);
      setMessage({ type: 'error', text: error });
      return;
    }

    if (editingIndex !== null) {
      // Update existing activity
      const newActivities = [...activities];
      newActivities[editingIndex] = { ...activityToAdd };
      setActivities(newActivities);
      setEditingIndex(null);
      setMessage({ type: 'success', text: 'Activity updated!' });
    } else {
      // Add new activity
      setActivities([...activities, { ...activityToAdd }]);
      setMessage({ type: 'success', text: 'Activity added!' });
    }

    // Reset form with incremented slide position
    setCurrentActivity({
      type: 'poll',
      activityId: '',
      slidePosition: {
        indexh: currentActivity.slidePosition.indexh + 1,
        indexv: 0,
      },
      question: '',
      options: ['', '', '', ''],
      showResults: 'live',
    });
  };

  const handleEditActivity = (index: number) => {
    setCurrentActivity({ ...activities[index] });
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentActivity({
      type: 'poll',
      activityId: '',
      slidePosition: { indexh: 0, indexv: 0 },
      question: '',
      options: ['', '', '', ''],
      showResults: 'live',
    });
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
    if (editingIndex === index) {
      handleCancelEdit();
    }
  };

  const buildConfigJSON = () => {
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
  };

  const handleSaveToFirebase = async () => {
    if (!presentationId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a presentation ID' });
      return;
    }

    if (activities.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one activity before saving' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const config = buildConfigJSON();
      const configRef = ref(database, `presentations/${presentationId}/config`);
      await set(configRef, config);
      setMessage({ type: 'success', text: `Saved ${activities.length} activities to Firebase!` });
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save: ${(error as Error).message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadJSON = () => {
    const config = buildConfigJSON();
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentationId || 'activities'}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Activity Builder</h1>
        <p style={styles.subtitle}>Create interactive activities for your slides.com presentations</p>
      </div>

      {/* Presentation ID Section */}
      <div style={styles.presentationSection}>
        <div style={styles.presentationInput}>
          <label style={styles.label}>
            Presentation ID or URL
            <small style={styles.hint}>
              Paste the full slides.com URL or just the ID (e.g., "JpLoPiI")
            </small>
            <input
              type="text"
              value={presentationInput}
              onChange={(e) => {
                setPresentationInput(e.target.value);
                // Auto-parse and set the ID immediately
                const parsed = parsePresentationId(e.target.value);
                setPresentationId(parsed);
              }}
              placeholder="e.g., https://mind.slides.com/d/JpLoPiI/live or just JpLoPiI"
              style={styles.input}
            />
            {presentationId && presentationId !== presentationInput && (
              <small style={styles.parsedId}>Using ID: {presentationId}</small>
            )}
            {presentationId && presentationId === presentationInput && (
              <small style={styles.parsedId}>ID: {presentationId}</small>
            )}
          </label>
          <div style={styles.buttonGroup}>
            <button
              onClick={handleLoadPresentation}
              style={styles.loadBtn}
              disabled={loading || !presentationId}
            >
              {loading ? 'Loading...' : 'Load Existing'}
            </button>
            <button
              onClick={() => {
                if (presentationId) {
                  setActivities([]);
                  setMessage({ type: 'success', text: `Starting fresh for ${presentationId}` });
                }
              }}
              style={styles.startFreshBtn}
              disabled={!presentationId}
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
        }}>
          {message.text}
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.leftPanel}>
          <div style={styles.formSection}>
            <h2 style={styles.sectionTitle}>
              {editingIndex !== null ? 'Edit Activity' : 'Create Activity'}
            </h2>

            <label style={styles.label}>
              Activity Type
              <select
                value={currentActivity.type}
                onChange={(e) => handleTypeChange(e.target.value as ActivityType)}
                style={styles.select}
              >
                <option value="poll">Poll (Multiple Choice)</option>
                <option value="quiz">Quiz (With Correct Answer)</option>
                <option value="web-link">Web Link / ST Math Game</option>
              </select>
            </label>

            <label style={styles.label}>
              Activity ID
              <small style={styles.hint}>A unique identifier for this activity</small>
              <input
                type="text"
                value={currentActivity.activityId}
                onChange={(e) => setCurrentActivity({ ...currentActivity, activityId: e.target.value })}
                placeholder="e.g., poll-1, quiz-intro, stmath-game"
                style={styles.input}
              />
            </label>

            <div style={styles.row}>
              <label style={styles.label}>
                Slide Number (H)
                <small style={styles.hint}>Horizontal slide index (0 = first slide)</small>
                <input
                  type="number"
                  value={currentActivity.slidePosition.indexh}
                  onChange={(e) => setCurrentActivity({
                    ...currentActivity,
                    slidePosition: { ...currentActivity.slidePosition, indexh: parseInt(e.target.value) || 0 }
                  })}
                  min="0"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Sub-slide (V)
                <small style={styles.hint}>Vertical slide index (usually 0)</small>
                <input
                  type="number"
                  value={currentActivity.slidePosition.indexv}
                  onChange={(e) => setCurrentActivity({
                    ...currentActivity,
                    slidePosition: { ...currentActivity.slidePosition, indexv: parseInt(e.target.value) || 0 }
                  })}
                  min="0"
                  style={styles.input}
                />
              </label>
            </div>

            {/* Poll/Quiz Fields */}
            {(currentActivity.type === 'poll' || currentActivity.type === 'quiz') && (
              <>
                <label style={styles.label}>
                  Question
                  <input
                    type="text"
                    value={currentActivity.question || ''}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, question: e.target.value })}
                    placeholder="Enter your question"
                    style={styles.input}
                  />
                </label>

                <div style={styles.label}>
                  Answer Options
                  {currentActivity.options?.map((option, index) => (
                    <div key={index} style={styles.optionRow}>
                      {currentActivity.type === 'quiz' && (
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentActivity.correctAnswer === index}
                          onChange={() => setCurrentActivity({ ...currentActivity, correctAnswer: index })}
                          title="Mark as correct answer"
                          style={styles.radio}
                        />
                      )}
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        style={{
                          ...styles.input,
                          ...(currentActivity.type === 'quiz' && currentActivity.correctAnswer === index ? styles.correctOption : {})
                        }}
                      />
                      {currentActivity.options && currentActivity.options.length > 2 && (
                        <button onClick={() => handleRemoveOption(index)} style={styles.removeBtn}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={handleAddOption} style={styles.addBtn}>+ Add Option</button>
                  {currentActivity.type === 'quiz' && (
                    <small style={styles.hint}>Click the radio button to mark the correct answer</small>
                  )}
                </div>

                {currentActivity.type === 'quiz' && (
                  <label style={styles.label}>
                    Time Limit (seconds)
                    <input
                      type="number"
                      value={currentActivity.timeLimit || 30}
                      onChange={(e) => setCurrentActivity({ ...currentActivity, timeLimit: parseInt(e.target.value) || 30 })}
                      min="5"
                      style={styles.input}
                    />
                  </label>
                )}

                <label style={styles.label}>
                  Show Results
                  <select
                    value={currentActivity.showResults || 'live'}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, showResults: e.target.value as any })}
                    style={styles.select}
                  >
                    <option value="live">Live (as responses come in)</option>
                    <option value="end">At End (after activity closes)</option>
                    <option value="never">Never (presenter only)</option>
                  </select>
                </label>
              </>
            )}

            {/* Web-link Fields */}
            {currentActivity.type === 'web-link' && (
              <>
                <label style={styles.label}>
                  Title
                  <input
                    type="text"
                    value={currentActivity.title || ''}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, title: e.target.value })}
                    placeholder="e.g., ST Math: Pattern Machine"
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Description (optional)
                  <input
                    type="text"
                    value={currentActivity.description || ''}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, description: e.target.value })}
                    placeholder="e.g., Complete the pattern puzzles!"
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  URL
                  <small style={styles.hint}>Full URL including https://</small>
                  <input
                    type="url"
                    value={currentActivity.url || ''}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, url: e.target.value })}
                    placeholder="https://play.stmath.com/demo.html#/play/..."
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Display Mode
                  <select
                    value={currentActivity.displayMode || 'iframe'}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, displayMode: e.target.value as any })}
                    style={styles.select}
                  >
                    <option value="iframe">Embedded (iframe) - Best for ST Math</option>
                    <option value="new-tab">Open in New Tab</option>
                    <option value="redirect">Redirect (leave attendee app)</option>
                  </select>
                </label>

                {currentActivity.displayMode === 'iframe' && (
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={currentActivity.fullScreen || false}
                      onChange={(e) => setCurrentActivity({ ...currentActivity, fullScreen: e.target.checked })}
                      style={styles.checkbox}
                    />
                    Full Screen Mode (hides header, best for games)
                  </label>
                )}
              </>
            )}

            <div style={styles.formActions}>
              <button onClick={handleAddActivity} style={styles.addActivityBtn}>
                {editingIndex !== null ? 'Update Activity' : 'Add Activity'}
              </button>
              {editingIndex !== null && (
                <button onClick={handleCancelEdit} style={styles.cancelBtn}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.activitiesList}>
            <h2 style={styles.sectionTitle}>Activities ({activities.length})</h2>
            {activities.length === 0 ? (
              <p style={styles.emptyState}>No activities yet. Create one on the left!</p>
            ) : (
              <div>
                {activities.map((activity, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.activityCard,
                      ...(editingIndex === index ? styles.activityCardEditing : {})
                    }}
                  >
                    <div style={styles.activityHeader}>
                      <strong>{activity.activityId}</strong>
                      <div style={styles.cardActions}>
                        <button onClick={() => handleEditActivity(index)} style={styles.editBtn}>Edit</button>
                        <button onClick={() => handleRemoveActivity(index)} style={styles.removeCardBtn}>×</button>
                      </div>
                    </div>
                    <div style={styles.activityDetails}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: activity.type === 'poll' ? '#dbeafe' :
                                        activity.type === 'quiz' ? '#fef3c7' : '#d1fae5',
                        color: activity.type === 'poll' ? '#1e40af' :
                               activity.type === 'quiz' ? '#92400e' : '#065f46',
                      }}>
                        {activity.type}
                      </span>
                      <span>Slide: {activity.slidePosition.indexh}</span>
                      {activity.slidePosition.indexv > 0 && (
                        <span>Sub: {activity.slidePosition.indexv}</span>
                      )}
                    </div>
                    {activity.question && (
                      <div style={styles.activityQuestion}>{activity.question}</div>
                    )}
                    {activity.title && (
                      <div style={styles.activityQuestion}>{activity.title}</div>
                    )}
                    {activity.url && (
                      <div style={styles.activityUrl}>{activity.url}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {activities.length > 0 && (
            <div style={styles.saveSection}>
              <h3 style={styles.sectionTitle}>Save Activities</h3>
              <div style={styles.saveActions}>
                <button
                  onClick={handleSaveToFirebase}
                  style={styles.saveBtn}
                  disabled={saving || !presentationId.trim()}
                >
                  {saving ? 'Saving...' : 'Save to Firebase'}
                </button>
                <button onClick={handleDownloadJSON} style={styles.downloadBtn}>
                  Download JSON
                </button>
              </div>
              {!presentationId.trim() && (
                <small style={styles.hint}>Enter a presentation ID above to save to Firebase</small>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  presentationSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    margin: '0 auto 20px',
  },
  presentationInput: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
  },
  message: {
    padding: '12px 20px',
    borderRadius: '6px',
    marginBottom: '20px',
    maxWidth: '800px',
    margin: '0 auto 20px',
    textAlign: 'center',
  },
  content: {
    display: 'flex',
    gap: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  leftPanel: {
    flex: '1',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  rightPanel: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    flex: 1,
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  optionRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    alignItems: 'center',
  },
  radio: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  removeBtn: {
    padding: '8px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  addBtn: {
    padding: '8px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '4px',
    alignSelf: 'flex-start',
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    fontWeight: 'normal',
  },
  parsedId: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '600',
    marginTop: '4px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#555',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  addActivityBtn: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  cancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexDirection: 'column',
  },
  loadBtn: {
    padding: '10px 20px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  startFreshBtn: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  activitiesList: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  emptyState: {
    color: '#999',
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '14px',
  },
  activityCard: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: '#fafafa',
  },
  activityCardEditing: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    padding: '4px 12px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  removeCardBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#999',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    lineHeight: '24px',
  },
  activityDetails: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
    alignItems: 'center',
  },
  badge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activityQuestion: {
    fontSize: '14px',
    color: '#333',
    marginTop: '8px',
  },
  activityUrl: {
    fontSize: '12px',
    color: '#6366f1',
    marginTop: '4px',
    wordBreak: 'break-all',
  },
  saveSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  saveActions: {
    display: 'flex',
    gap: '12px',
  },
  saveBtn: {
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    flex: 1,
  },
  downloadBtn: {
    padding: '12px 24px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
};
