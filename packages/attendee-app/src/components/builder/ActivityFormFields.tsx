import React from 'react';

export type ActivityType = 'poll' | 'quiz' | 'web-link';

export type ActivityFormData = {
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

export const getDefaultActivity = (type: ActivityType = 'poll', indexh = 0, indexv = 0): ActivityFormData => {
  if (type === 'web-link') {
    return {
      type,
      activityId: '',
      slidePosition: { indexh, indexv },
      title: '',
      description: '',
      url: '',
      displayMode: 'iframe',
      fullScreen: false,
    };
  }
  return {
    type,
    activityId: '',
    slidePosition: { indexh, indexv },
    question: '',
    options: ['', '', '', ''],
    showResults: 'live',
    ...(type === 'quiz' ? { correctAnswer: 0, timeLimit: 30 } : {}),
  };
};

export const validateActivity = (activity: ActivityFormData): string | null => {
  if (activity.type === 'poll' || activity.type === 'quiz') {
    if (!activity.question?.trim()) return 'Question is required';
    if (!activity.options?.length || activity.options.length < 2) {
      return 'At least 2 options are required';
    }
    if (activity.options.some(opt => !opt.trim())) {
      return 'All options must have text';
    }
    if (activity.type === 'quiz') {
      if (activity.correctAnswer === undefined ||
          activity.correctAnswer < 0 ||
          activity.correctAnswer >= activity.options.length) {
        return 'Valid correct answer must be selected';
      }
    }
  } else if (activity.type === 'web-link') {
    if (!activity.title?.trim()) return 'Title is required';
    if (!activity.url?.trim()) return 'URL is required';
    try {
      new URL(activity.url);
    } catch {
      return 'Please enter a valid URL';
    }
  }

  return null;
};

interface ActivityFormFieldsProps {
  activity: ActivityFormData;
  onChange: (activity: ActivityFormData) => void;
  showSlidePosition?: boolean;
}

export const ActivityFormFields: React.FC<ActivityFormFieldsProps> = ({
  activity,
  onChange,
  showSlidePosition = true,
}) => {
  const handleTypeChange = (type: ActivityType) => {
    const newActivity = getDefaultActivity(type, activity.slidePosition.indexh, activity.slidePosition.indexv);
    newActivity.activityId = activity.activityId;
    onChange(newActivity);
  };

  const handleAddOption = () => {
    if (activity.options) {
      onChange({
        ...activity,
        options: [...activity.options, ''],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (activity.options && activity.options.length > 2) {
      onChange({
        ...activity,
        options: activity.options.filter((_, i) => i !== index),
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (activity.options) {
      const newOptions = [...activity.options];
      newOptions[index] = value;
      onChange({ ...activity, options: newOptions });
    }
  };

  return (
    <div style={styles.formSection}>
      <label style={styles.label}>
        Activity Type
        <select
          value={activity.type}
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
        <small style={styles.hint}>Leave blank to auto-generate</small>
        <input
          type="text"
          value={activity.activityId}
          onChange={(e) => onChange({ ...activity, activityId: e.target.value })}
          placeholder="e.g., poll-1, quiz-intro (optional)"
          style={styles.input}
        />
      </label>

      {showSlidePosition && (
        <div style={styles.row}>
          <label style={styles.label}>
            Slide Number (H)
            <small style={styles.hint}>Horizontal slide index (0 = first slide)</small>
            <input
              type="number"
              value={activity.slidePosition.indexh}
              onChange={(e) => onChange({
                ...activity,
                slidePosition: { ...activity.slidePosition, indexh: parseInt(e.target.value) || 0 }
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
              value={activity.slidePosition.indexv}
              onChange={(e) => onChange({
                ...activity,
                slidePosition: { ...activity.slidePosition, indexv: parseInt(e.target.value) || 0 }
              })}
              min="0"
              style={styles.input}
            />
          </label>
        </div>
      )}

      {/* Poll/Quiz Fields */}
      {(activity.type === 'poll' || activity.type === 'quiz') && (
        <>
          <label style={styles.label}>
            Question
            <input
              type="text"
              value={activity.question || ''}
              onChange={(e) => onChange({ ...activity, question: e.target.value })}
              placeholder="Enter your question"
              style={styles.input}
            />
          </label>

          <div style={styles.label}>
            Answer Options
            {activity.options?.map((option, index) => (
              <div key={index} style={styles.optionRow}>
                {activity.type === 'quiz' && (
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={activity.correctAnswer === index}
                    onChange={() => onChange({ ...activity, correctAnswer: index })}
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
                    ...(activity.type === 'quiz' && activity.correctAnswer === index ? styles.correctOption : {})
                  }}
                />
                {activity.options && activity.options.length > 2 && (
                  <button onClick={() => handleRemoveOption(index)} style={styles.removeBtn}>×</button>
                )}
              </div>
            ))}
            <button onClick={handleAddOption} style={styles.addBtn}>+ Add Option</button>
            {activity.type === 'quiz' && (
              <small style={styles.hint}>Click the radio button to mark the correct answer</small>
            )}
          </div>

          {activity.type === 'quiz' && (
            <label style={styles.label}>
              Time Limit (seconds)
              <input
                type="number"
                value={activity.timeLimit || 30}
                onChange={(e) => onChange({ ...activity, timeLimit: parseInt(e.target.value) || 30 })}
                min="5"
                style={styles.input}
              />
            </label>
          )}

          <label style={styles.label}>
            Show Results
            <select
              value={activity.showResults || 'live'}
              onChange={(e) => onChange({ ...activity, showResults: e.target.value as any })}
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
      {activity.type === 'web-link' && (
        <>
          <label style={styles.label}>
            Title
            <input
              type="text"
              value={activity.title || ''}
              onChange={(e) => onChange({ ...activity, title: e.target.value })}
              placeholder="e.g., ST Math: Pattern Machine"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Description (optional)
            <input
              type="text"
              value={activity.description || ''}
              onChange={(e) => onChange({ ...activity, description: e.target.value })}
              placeholder="e.g., Complete the pattern puzzles!"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            URL
            <small style={styles.hint}>Full URL including https://</small>
            <input
              type="url"
              value={activity.url || ''}
              onChange={(e) => onChange({ ...activity, url: e.target.value })}
              placeholder="https://play.stmath.com/demo.html#/play/..."
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Display Mode
            <select
              value={activity.displayMode || 'iframe'}
              onChange={(e) => onChange({ ...activity, displayMode: e.target.value as any })}
              style={styles.select}
            >
              <option value="iframe">Embedded (iframe) - Best for ST Math</option>
              <option value="new-tab">Open in New Tab</option>
              <option value="redirect">Redirect (leave attendee app)</option>
            </select>
          </label>

          {activity.displayMode === 'iframe' && (
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={activity.fullScreen || false}
                onChange={(e) => onChange({ ...activity, fullScreen: e.target.checked })}
                style={styles.checkbox}
              />
              Full Screen Mode (hides header, best for games)
            </label>
          )}
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
};
