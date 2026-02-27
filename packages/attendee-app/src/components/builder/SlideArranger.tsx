import React, { useRef, useState, useCallback } from 'react';
import { VerticalSlideColumn } from './VerticalSlideColumn';
import { AddSlideButton } from './SlideThumbnail';
import { ActivityFormData } from './ActivityFormFields';

interface SlideArrangerProps {
  presentationId: string;
  horizontalCount: number;
  verticalCounts: Map<number, number>; // indexh -> vertical slide count
  activities: ActivityFormData[];
  selectedSlide: { indexh: number; indexv: number } | null;
  onSlideClick: (indexh: number, indexv: number) => void;
  onAddHorizontal: () => void;
  onAddVertical: (indexh: number) => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
  hasChanges: boolean;
}

export const SlideArranger: React.FC<SlideArrangerProps> = ({
  presentationId,
  horizontalCount,
  verticalCounts,
  activities,
  selectedSlide,
  onSlideClick,
  onAddHorizontal,
  onAddVertical,
  onSave,
  onBack,
  saving,
  hasChanges,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Click-and-drag scrolling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Render columns for each horizontal slide
  const columns = [];
  for (let ih = 0; ih < horizontalCount; ih++) {
    const vertCount = verticalCounts.get(ih) || 1;
    columns.push(
      <VerticalSlideColumn
        key={ih}
        indexh={ih}
        verticalCount={vertCount}
        activities={activities}
        selectedSlide={selectedSlide}
        onSlideClick={onSlideClick}
        onAddVertical={onAddVertical}
      />
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={onBack} style={styles.backBtn}>
            ← Back
          </button>
          <h1 style={styles.title}>
            {presentationId}
          </h1>
          <span style={styles.slideCount}>
            {horizontalCount} slides · {activities.length} activities
          </span>
        </div>
        <div style={styles.headerRight}>
          {hasChanges && <span style={styles.unsavedIndicator}>Unsaved changes</span>}
          <button
            onClick={onSave}
            style={{
              ...styles.saveBtn,
              opacity: saving ? 0.7 : 1,
            }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div style={styles.instructions}>
        Click a slide to add or edit an activity. Drag to scroll.
      </div>

      {/* Slide Grid */}
      <div
        ref={scrollContainerRef}
        style={{
          ...styles.scrollContainer,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div style={styles.slideGrid}>
          {columns}
          <div style={styles.addColumnWrapper}>
            <AddSlideButton
              direction="horizontal"
              onClick={onAddHorizontal}
            />
          </div>
        </div>
      </div>

      {/* Footer with keyboard hints */}
      <div style={styles.footer}>
        <span>Tip: Two-finger scroll or click-drag to navigate</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#1a1a2e',
    color: 'white',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #333',
    backgroundColor: '#16213e',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    border: '1px solid #4b5563',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
  },
  slideCount: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  unsavedIndicator: {
    fontSize: '12px',
    color: '#f59e0b',
    padding: '4px 8px',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '4px',
  },
  saveBtn: {
    padding: '10px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  instructions: {
    textAlign: 'center',
    padding: '12px',
    fontSize: '14px',
    color: '#9ca3af',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scrollContainer: {
    flex: 1,
    overflowX: 'auto',
    overflowY: 'auto',
    padding: '24px',
    WebkitOverflowScrolling: 'touch',
  },
  slideGrid: {
    display: 'flex',
    gap: '16px',
    minWidth: 'max-content',
    paddingBottom: '24px',
  },
  addColumnWrapper: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  footer: {
    padding: '12px 24px',
    borderTop: '1px solid #333',
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    backgroundColor: '#16213e',
  },
};
