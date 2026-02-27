import React, { useEffect, useCallback } from 'react';
import { ActivityFormFields, ActivityFormData, validateActivity } from './ActivityFormFields';

interface ActivityEditorModalProps {
  isOpen: boolean;
  slidePosition: { indexh: number; indexv: number };
  existingActivity?: ActivityFormData;
  activity: ActivityFormData;
  onActivityChange: (activity: ActivityFormData) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const ActivityEditorModal: React.FC<ActivityEditorModalProps> = ({
  isOpen,
  slidePosition,
  existingActivity,
  activity,
  onActivityChange,
  onSave,
  onDelete,
  onClose,
}) => {
  // Handle escape key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const displaySlide = slidePosition.indexv === 0
    ? `Slide ${slidePosition.indexh + 1}`
    : `Slide ${slidePosition.indexh + 1}.${slidePosition.indexv + 1}`;

  const handleSave = () => {
    // Auto-generate ID if needed
    let activityToSave = { ...activity };
    if (!activityToSave.activityId.trim()) {
      const slideNum = activityToSave.slidePosition.indexh;
      activityToSave.activityId = `${activityToSave.type}-slide${slideNum}-${Date.now().toString(36)}`;
      onActivityChange(activityToSave);
    }

    const error = validateActivity(activityToSave);
    if (error) {
      alert(error);
      return;
    }
    onSave();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleBackdropClick}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {existingActivity ? 'Edit Activity' : 'Add Activity'} - {displaySlide}
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.modalBody}>
          <ActivityFormFields
            activity={activity}
            onChange={onActivityChange}
            showSlidePosition={false}
          />
        </div>

        <div style={styles.modalFooter}>
          <div style={styles.footerLeft}>
            {existingActivity && (
              <button onClick={onDelete} style={styles.deleteBtn}>
                Delete Activity
              </button>
            )}
          </div>
          <div style={styles.footerRight}>
            <button onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={handleSave} style={styles.saveBtn}>
              {existingActivity ? 'Update' : 'Add'} Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    lineHeight: '32px',
    textAlign: 'center',
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: '0 0 12px 12px',
  },
  footerLeft: {},
  footerRight: {
    display: 'flex',
    gap: '12px',
  },
  deleteBtn: {
    padding: '10px 20px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  saveBtn: {
    padding: '10px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};
