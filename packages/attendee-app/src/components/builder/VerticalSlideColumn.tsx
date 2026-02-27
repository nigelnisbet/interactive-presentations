import React from 'react';
import { SlideThumbnail, AddSlideButton } from './SlideThumbnail';
import { ActivityFormData } from './ActivityFormFields';

interface VerticalSlideColumnProps {
  indexh: number;
  verticalCount: number; // Number of vertical slides (minimum 1 for the main slide)
  activities: ActivityFormData[];
  selectedSlide: { indexh: number; indexv: number } | null;
  onSlideClick: (indexh: number, indexv: number) => void;
  onAddVertical: (indexh: number) => void;
}

export const VerticalSlideColumn: React.FC<VerticalSlideColumnProps> = ({
  indexh,
  verticalCount,
  activities,
  selectedSlide,
  onSlideClick,
  onAddVertical,
}) => {
  // Get activity at a specific position
  const getActivityAt = (ih: number, iv: number) => {
    return activities.find(
      a => a.slidePosition.indexh === ih && a.slidePosition.indexv === iv
    );
  };

  // Check if a slide is selected
  const isSelected = (ih: number, iv: number) => {
    return selectedSlide?.indexh === ih && selectedSlide?.indexv === iv;
  };

  // Render vertical slides (indexv: 0, 1, 2, ...)
  const slides = [];
  for (let iv = 0; iv < verticalCount; iv++) {
    slides.push(
      <SlideThumbnail
        key={`${indexh}-${iv}`}
        indexh={indexh}
        indexv={iv}
        activity={getActivityAt(indexh, iv)}
        onClick={() => onSlideClick(indexh, iv)}
        isSelected={isSelected(indexh, iv)}
      />
    );
  }

  return (
    <div style={styles.column}>
      {slides}
      <AddSlideButton
        direction="vertical"
        onClick={() => onAddVertical(indexh)}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
};
