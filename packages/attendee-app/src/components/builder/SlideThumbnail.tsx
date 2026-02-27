import React from 'react';
import { ActivityFormData } from './ActivityFormFields';

// SVG Icons for activity types
const PollIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="14" width="4" height="6" rx="1" />
    <rect x="10" y="8" width="4" height="12" rx="1" />
    <rect x="16" y="4" width="4" height="16" rx="1" />
  </svg>
);

const QuizIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold">?</text>
  </svg>
);

const WebLinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const activityColors = {
  poll: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  quiz: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'web-link': { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
};

interface SlideThumbnailProps {
  indexh: number;
  indexv: number;
  activity?: ActivityFormData;
  onClick: () => void;
  isSelected?: boolean;
}

export const SlideThumbnail: React.FC<SlideThumbnailProps> = ({
  indexh,
  indexv,
  activity,
  onClick,
  isSelected = false,
}) => {
  const displayNumber = indexv === 0
    ? `${indexh + 1}`
    : `${indexh + 1}.${indexv + 1}`;

  const colors = activity ? activityColors[activity.type] : null;

  const getActivityIcon = () => {
    if (!activity) return null;
    switch (activity.type) {
      case 'poll': return <PollIcon />;
      case 'quiz': return <QuizIcon />;
      case 'web-link': return <WebLinkIcon />;
      default: return null;
    }
  };

  const getActivityTitle = () => {
    if (!activity) return null;
    if (activity.type === 'web-link') {
      return activity.title;
    }
    return activity.question;
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...styles.thumbnail,
        backgroundColor: activity ? colors?.bg : '#374151',
        borderColor: isSelected ? '#fff' : (colors?.border || '#4b5563'),
        boxShadow: isSelected ? '0 0 0 3px #3b82f6' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={styles.slideNumber}>{displayNumber}</div>

      {activity ? (
        <div style={{ ...styles.activityContent, color: colors?.text }}>
          <div style={styles.icon}>{getActivityIcon()}</div>
          <div style={styles.activityTitle}>
            {getActivityTitle()?.slice(0, 30) || activity.type}
            {(getActivityTitle()?.length || 0) > 30 && '...'}
          </div>
          <div style={styles.activityType}>{activity.type}</div>
        </div>
      ) : (
        <div style={styles.emptyContent}>
          <div style={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
              <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div style={styles.emptyText}>No activity</div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  thumbnail: {
    width: '140px',
    height: '100px',
    borderRadius: '8px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  slideNumber: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  activityContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    textAlign: 'center',
  },
  icon: {
    marginBottom: '4px',
  },
  activityTitle: {
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '1.2',
    maxHeight: '28px',
    overflow: 'hidden',
  },
  activityType: {
    fontSize: '9px',
    textTransform: 'uppercase',
    opacity: 0.7,
    marginTop: '2px',
  },
  emptyContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyIcon: {
    color: '#9ca3af',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '10px',
    marginTop: '4px',
  },
};

// Add Slide Button Component
interface AddSlideButtonProps {
  direction: 'horizontal' | 'vertical';
  onClick: () => void;
}

export const AddSlideButton: React.FC<AddSlideButtonProps> = ({ direction, onClick }) => {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      onClick={onClick}
      style={{
        ...styles.thumbnail,
        width: isHorizontal ? '140px' : '120px',
        height: isHorizontal ? '100px' : '80px',
        backgroundColor: 'transparent',
        borderColor: '#4b5563',
        borderStyle: 'dashed',
        opacity: 0.5,
      }}
    >
      <div style={styles.emptyContent}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <div style={{ ...styles.emptyText, marginTop: '4px' }}>
          {isHorizontal ? 'Add Slide' : 'Add Sub-slide'}
        </div>
      </div>
    </div>
  );
};
