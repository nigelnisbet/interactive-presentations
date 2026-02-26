import React, { useState } from 'react';
import { ActivityType, PollActivity, QuizActivity } from '@interactive-presentations/shared';

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

  // STMath-specific
  gameId?: string;
  gameConfig?: string; // JSON string
};

export const ActivityBuilder: React.FC = () => {
  const [activities, setActivities] = useState<ActivityFormData[]>([]);
  const [currentActivity, setCurrentActivity] = useState<ActivityFormData>({
    type: 'poll',
    activityId: '',
    slidePosition: { indexh: 0, indexv: 0 },
    question: '',
    options: ['', '', '', ''],
    showResults: 'live',
  });
  const [jsonOutput, setJsonOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleTypeChange = (type: ActivityType) => {
    setCurrentActivity({
      type,
      activityId: '',
      slidePosition: { indexh: 0, indexv: 0 },
      ...(type === 'poll' || type === 'quiz' ? {
        question: '',
        options: ['', '', '', ''],
        showResults: 'live',
        ...(type === 'quiz' ? { correctAnswer: 0, timeLimit: 30 } : {}),
      } : {
        gameId: '',
        gameConfig: '{}',
      }),
    });
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
    } else if (currentActivity.type === 'stmath-game') {
      if (!currentActivity.gameId?.trim()) return 'Game ID is required';
      try {
        JSON.parse(currentActivity.gameConfig || '{}');
      } catch {
        return 'Game config must be valid JSON';
      }
    }

    return null;
  };

  const handleAddActivity = () => {
    const error = validateActivity();
    if (error) {
      alert(error);
      return;
    }

    setActivities([...activities, { ...currentActivity }]);

    // Reset form with incremented slide position
    setCurrentActivity({
      ...currentActivity,
      activityId: '',
      slidePosition: {
        indexh: currentActivity.slidePosition.indexh + 1,
        indexv: 0,
      },
    });
  };

  const generateJSON = () => {
    const output = activities.map(activity => {
      const base = {
        activityId: activity.activityId,
        slidePosition: activity.slidePosition,
      };

      if (activity.type === 'poll') {
        return {
          ...base,
          config: {
            type: 'poll',
            question: activity.question,
            options: activity.options,
            showResults: activity.showResults,
          } as PollActivity,
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
            points: 100, // Default points
          } as QuizActivity,
        };
      } else {
        return {
          ...base,
          config: {
            type: 'stmath-game',
            gameId: activity.gameId,
            config: JSON.parse(activity.gameConfig || '{}'),
          } as any,
        };
      }
    });

    const json = JSON.stringify(output, null, 2);
    setJsonOutput(json);
    return json;
  };

  const handleCopyJSON = () => {
    const json = generateJSON();
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const json = generateJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activities.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Activity Builder</h1>

      <div style={styles.content}>
        <div style={styles.leftPanel}>
          <div style={styles.formSection}>
            <h2 style={styles.sectionTitle}>Create Activity</h2>

            <label style={styles.label}>
              Activity Type
              <select
                value={currentActivity.type}
                onChange={(e) => handleTypeChange(e.target.value as ActivityType)}
                style={styles.select}
              >
                <option value="poll">Poll</option>
                <option value="quiz">Quiz</option>
                <option value="stmath">ST Math Game</option>
              </select>
            </label>

            <label style={styles.label}>
              Activity ID
              <input
                type="text"
                value={currentActivity.activityId}
                onChange={(e) => setCurrentActivity({ ...currentActivity, activityId: e.target.value })}
                placeholder="e.g., poll-1, quiz-intro"
                style={styles.input}
              />
            </label>

            <div style={styles.row}>
              <label style={styles.label}>
                Slide H
                <input
                  type="number"
                  value={currentActivity.slidePosition.indexh}
                  onChange={(e) => setCurrentActivity({
                    ...currentActivity,
                    slidePosition: { ...currentActivity.slidePosition, indexh: parseInt(e.target.value) || 0 }
                  })}
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Slide V
                <input
                  type="number"
                  value={currentActivity.slidePosition.indexv}
                  onChange={(e) => setCurrentActivity({
                    ...currentActivity,
                    slidePosition: { ...currentActivity.slidePosition, indexv: parseInt(e.target.value) || 0 }
                  })}
                  style={styles.input}
                />
              </label>
            </div>

            {(currentActivity.type === 'poll' || currentActivity.type === 'quiz') && (
              <>
                <label style={styles.label}>
                  Question
                  <input
                    type="text"
                    value={currentActivity.question}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, question: e.target.value })}
                    placeholder="Enter your question"
                    style={styles.input}
                  />
                </label>

                <div style={styles.label}>
                  Options
                  {currentActivity.options?.map((option, index) => (
                    <div key={index} style={styles.optionRow}>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        style={styles.input}
                      />
                      {currentActivity.options && currentActivity.options.length > 2 && (
                        <button onClick={() => handleRemoveOption(index)} style={styles.removeBtn}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={handleAddOption} style={styles.addBtn}>+ Add Option</button>
                </div>

                {currentActivity.type === 'quiz' && (
                  <>
                    <label style={styles.label}>
                      Correct Answer (index)
                      <input
                        type="number"
                        value={currentActivity.correctAnswer}
                        onChange={(e) => setCurrentActivity({ ...currentActivity, correctAnswer: parseInt(e.target.value) || 0 })}
                        min="0"
                        max={(currentActivity.options?.length || 1) - 1}
                        style={styles.input}
                      />
                      <small style={styles.hint}>0 = first option, 1 = second option, etc.</small>
                    </label>

                    <label style={styles.label}>
                      Time Limit (seconds)
                      <input
                        type="number"
                        value={currentActivity.timeLimit}
                        onChange={(e) => setCurrentActivity({ ...currentActivity, timeLimit: parseInt(e.target.value) || 30 })}
                        min="5"
                        style={styles.input}
                      />
                    </label>
                  </>
                )}

                <label style={styles.label}>
                  Show Results
                  <select
                    value={currentActivity.showResults}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, showResults: e.target.value as any })}
                    style={styles.select}
                  >
                    <option value="live">Live (as responses come in)</option>
                    <option value="end">At End (after activity closes)</option>
                    <option value="never">Never</option>
                  </select>
                </label>
              </>
            )}

            {currentActivity.type === 'stmath-game' && (
              <>
                <label style={styles.label}>
                  Game ID
                  <input
                    type="text"
                    value={currentActivity.gameId}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, gameId: e.target.value })}
                    placeholder="e.g., jiji-crossing"
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Game Config (JSON)
                  <textarea
                    value={currentActivity.gameConfig}
                    onChange={(e) => setCurrentActivity({ ...currentActivity, gameConfig: e.target.value })}
                    placeholder='{"level": 1, "difficulty": "easy"}'
                    style={{ ...styles.input, minHeight: '100px', fontFamily: 'monospace' }}
                  />
                </label>
              </>
            )}

            <button onClick={handleAddActivity} style={styles.addActivityBtn}>
              Add Activity to List
            </button>
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
                  <div key={index} style={styles.activityCard}>
                    <div style={styles.activityHeader}>
                      <strong>{activity.activityId}</strong>
                      <button onClick={() => handleRemoveActivity(index)} style={styles.removeCardBtn}>×</button>
                    </div>
                    <div style={styles.activityDetails}>
                      <span style={styles.badge}>{activity.type}</span>
                      <span>Slide: {activity.slidePosition.indexh},{activity.slidePosition.indexv}</span>
                    </div>
                    {activity.question && (
                      <div style={styles.activityQuestion}>{activity.question}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {activities.length > 0 && (
            <div style={styles.jsonSection}>
              <h3 style={styles.sectionTitle}>JSON Output</h3>
              <div style={styles.jsonActions}>
                <button onClick={handleCopyJSON} style={styles.actionBtn}>
                  {copied ? '✓ Copied!' : 'Copy JSON'}
                </button>
                <button onClick={handleDownloadJSON} style={styles.actionBtn}>
                  Download JSON
                </button>
              </div>
              <pre style={styles.jsonOutput}>{jsonOutput || generateJSON()}</pre>
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
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
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
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  optionRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  removeBtn: {
    padding: '8px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  addBtn: {
    padding: '8px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '4px',
  },
  hint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
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
    marginTop: '8px',
  },
  activitiesList: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  emptyState: {
    color: '#999',
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '14px',
  },
  activityCard: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '12px',
    backgroundColor: '#fafafa',
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
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
  },
  activityDetails: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  badge: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  activityQuestion: {
    fontSize: '13px',
    color: '#333',
    marginTop: '8px',
  },
  jsonSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    flex: '1',
  },
  jsonActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  actionBtn: {
    padding: '8px 16px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  jsonOutput: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    padding: '16px',
    borderRadius: '6px',
    fontSize: '12px',
    overflowX: 'auto',
    maxHeight: '400px',
    overflowY: 'auto',
  },
};
