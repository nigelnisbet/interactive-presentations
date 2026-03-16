// Fraction Builder Activity
// Build fractions by selecting denominator (drag down) then numerator (drag up)

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Canvas sizing for mobile portrait
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 900;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Colors
const ST_MATH_BLUE = '#0077c8';
const YELLOW = '#F7B731';
const GREY = '#CCCCCC';
const WHITE = '#FFFFFF';
const SEGMENT_BORDER = '#333333';

// Layout
const BAR_WIDTH = 180;
const BAR_HEIGHT = 600;
const BAR_X = (CANVAS_WIDTH - BAR_WIDTH) / 2 - 60; // Offset left to make room for sliders
const BAR_Y = (CANVAS_HEIGHT - BAR_HEIGHT) / 2;

const SLIDER_X = BAR_X + BAR_WIDTH + 40;
const SLIDER_WIDTH = 30;
const SLIDER_HEIGHT = BAR_HEIGHT;

const GO_BUTTON_SIZE = 80;
const GO_BUTTON_X = CANVAS_WIDTH - GO_BUTTON_SIZE - 30;
const GO_BUTTON_Y = 30;

// State
type Mode = 'denominator' | 'numerator';
let mode: Mode = 'denominator';
let denominator = 1;
let numerator = 0;
let denominatorSliderY = BAR_Y; // Top position
let numeratorSliderY = BAR_Y + BAR_HEIGHT; // Bottom position
let goButtonActive = false;
let denominatorTouched = false;
let isDraggingDenominator = false;
let isDraggingNumerator = false;

const MAX_DENOMINATOR = 15;

// Calculate denominator from slider position
// Slider position represents "fraction of the whole bar"
// At top (0%) = 1 whole, pass 50% = 2 halves, pass 66.7% = 3 thirds, pass 75% = 4 fourths, etc.
function getDenominatorFromPosition(y: number): number {
  const relativeY = y - BAR_Y;
  const fractionOfBar = relativeY / BAR_HEIGHT; // 0.0 to 1.0

  if (fractionOfBar <= 0) return 1;

  // Check each denominator threshold - once we pass threshold, we're in that denominator
  // Working backwards from MAX to 2 (most divisions to least)
  for (let denom = MAX_DENOMINATOR; denom >= 2; denom--) {
    const threshold = (denom - 1) / denom; // e.g., 2: 1/2=0.5, 3: 2/3=0.667, 4: 3/4=0.75
    if (fractionOfBar >= threshold) {
      return denom;
    }
  }

  return 1;
}

// Calculate numerator from slider position
function getNumeratorFromPosition(y: number): number {
  const relativeY = y - BAR_Y;
  const progress = 1 - Math.max(0, Math.min(1, relativeY / BAR_HEIGHT));
  return Math.floor(progress * denominator);
}

// Calculate slider Y position from denominator
function getSliderYFromDenominator(denom: number): number {
  if (denom === 1) return BAR_Y;
  const threshold = (denom - 1) / denom;
  return BAR_Y + threshold * BAR_HEIGHT;
}

// Draw fraction bar
function drawBar() {
  // Main bar background
  ctx.fillStyle = WHITE;
  ctx.fillRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);
  ctx.strokeStyle = SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(BAR_X, BAR_Y, BAR_WIDTH, BAR_HEIGHT);

  if (denominator > 1) {
    const segmentHeight = BAR_HEIGHT / denominator;

    // Draw filled segments
    ctx.fillStyle = ST_MATH_BLUE;
    for (let i = 0; i < numerator; i++) {
      const segmentY = BAR_Y + BAR_HEIGHT - (i + 1) * segmentHeight;
      ctx.fillRect(BAR_X, segmentY, BAR_WIDTH, segmentHeight);
    }

    // Draw segment borders
    ctx.strokeStyle = SEGMENT_BORDER;
    ctx.lineWidth = 2;
    for (let i = 1; i < denominator; i++) {
      const y = BAR_Y + i * segmentHeight;
      ctx.beginPath();
      ctx.moveTo(BAR_X, y);
      ctx.lineTo(BAR_X + BAR_WIDTH, y);
      ctx.stroke();
    }
  }
}

// Draw denominator slider (top of bar)
function drawDenominatorSlider() {
  if (mode !== 'denominator') return;

  // Slider track
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(SLIDER_X, BAR_Y, SLIDER_WIDTH, BAR_HEIGHT);
  ctx.strokeStyle = SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(SLIDER_X, BAR_Y, SLIDER_WIDTH, BAR_HEIGHT);

  // Slider handle
  const handleHeight = 60;
  const handleY = denominatorSliderY - handleHeight / 2;
  const handleCenterY = denominatorSliderY; // This is the exact trigger point

  // Draw line from slider center to bar edge
  ctx.strokeStyle = SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(SLIDER_X - 10, handleCenterY);
  ctx.lineTo(BAR_X + BAR_WIDTH, handleCenterY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  ctx.fillStyle = isDraggingDenominator ? YELLOW : ST_MATH_BLUE;
  ctx.beginPath();
  ctx.roundRect(
    SLIDER_X - 10,
    handleY,
    SLIDER_WIDTH + 20,
    handleHeight,
    [15]
  );
  ctx.fill();
  ctx.strokeStyle = SEGMENT_BORDER;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Handle grip lines
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    const lineY = handleY + handleHeight / 2 + i * 10;
    ctx.beginPath();
    ctx.moveTo(SLIDER_X, lineY);
    ctx.lineTo(SLIDER_X + SLIDER_WIDTH, lineY);
    ctx.stroke();
  }
}

// Draw numerator slider (bottom of bar)
function drawNumeratorSlider() {
  if (mode !== 'numerator') return;

  // Slider track
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(SLIDER_X, BAR_Y, SLIDER_WIDTH, BAR_HEIGHT);
  ctx.strokeStyle = SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(SLIDER_X, BAR_Y, SLIDER_WIDTH, BAR_HEIGHT);

  // Slider handle
  const handleHeight = 60;
  const handleY = numeratorSliderY - handleHeight / 2;
  const handleCenterY = numeratorSliderY; // This is the exact trigger point

  // Draw line from slider center to bar edge
  ctx.strokeStyle = SEGMENT_BORDER;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(SLIDER_X - 10, handleCenterY);
  ctx.lineTo(BAR_X + BAR_WIDTH, handleCenterY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  ctx.fillStyle = isDraggingNumerator ? YELLOW : ST_MATH_BLUE;
  ctx.beginPath();
  ctx.roundRect(
    SLIDER_X - 10,
    handleY,
    SLIDER_WIDTH + 20,
    handleHeight,
    [15]
  );
  ctx.fill();
  ctx.strokeStyle = SEGMENT_BORDER;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Handle grip lines
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    const lineY = handleY + handleHeight / 2 + i * 10;
    ctx.beginPath();
    ctx.moveTo(SLIDER_X, lineY);
    ctx.lineTo(SLIDER_X + SLIDER_WIDTH, lineY);
    ctx.stroke();
  }
}

// Draw GO/Reset button
function drawGoButton() {
  const centerX = GO_BUTTON_X + GO_BUTTON_SIZE / 2;
  const centerY = GO_BUTTON_Y + GO_BUTTON_SIZE / 2;

  if (mode === 'denominator') {
    // GO button
    const color = goButtonActive ? YELLOW : GREY;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, GO_BUTTON_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SEGMENT_BORDER;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Arrow (pointing right)
    if (goButtonActive) {
      const arrowSize = 25;

      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.moveTo(centerX - arrowSize / 2, centerY - arrowSize);
      ctx.lineTo(centerX + arrowSize / 2, centerY);
      ctx.lineTo(centerX - arrowSize / 2, centerY + arrowSize);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // RESET button (in numerator mode)
    ctx.fillStyle = YELLOW;
    ctx.beginPath();
    ctx.arc(centerX, centerY, GO_BUTTON_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SEGMENT_BORDER;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Circular arrow icon (reset symbol)
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Draw circular arrow
    ctx.beginPath();
    ctx.arc(centerX, centerY, 22, -Math.PI * 0.8, Math.PI * 0.8);
    ctx.stroke();

    // Arrow head
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(centerX + 18, centerY - 8);
    ctx.lineTo(centerX + 26, centerY - 2);
    ctx.lineTo(centerX + 20, centerY + 6);
    ctx.closePath();
    ctx.fill();
  }
}

// Main render
function render() {
  // Clear
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw components
  drawBar();
  drawDenominatorSlider();
  drawNumeratorSlider();
  drawGoButton();

  requestAnimationFrame(render);
}

// Reset to initial state
function reset() {
  mode = 'denominator';
  denominator = 1;
  numerator = 0;
  denominatorSliderY = BAR_Y;
  numeratorSliderY = BAR_Y + BAR_HEIGHT;
  goButtonActive = false;
  denominatorTouched = false;
  isDraggingDenominator = false;
  isDraggingNumerator = false;
}

// Handle touch/mouse start
function handleStart(x: number, y: number) {
  // Check button click (works in both modes)
  const dx = x - (GO_BUTTON_X + GO_BUTTON_SIZE / 2);
  const dy = y - (GO_BUTTON_Y + GO_BUTTON_SIZE / 2);
  const clickedButton = Math.sqrt(dx * dx + dy * dy) < GO_BUTTON_SIZE / 2;

  if (mode === 'denominator') {
    // GO button
    if (clickedButton && goButtonActive) {
      mode = 'numerator';
      numeratorSliderY = BAR_Y + BAR_HEIGHT; // Start at bottom
      return;
    }

    // Check denominator slider
    if (
      x >= SLIDER_X - 20 &&
      x <= SLIDER_X + SLIDER_WIDTH + 20 &&
      y >= BAR_Y &&
      y <= BAR_Y + BAR_HEIGHT
    ) {
      isDraggingDenominator = true;
      denominatorTouched = true;
      goButtonActive = true;
      handleDenominatorMove(y);
    }
  } else if (mode === 'numerator') {
    // RESET button
    if (clickedButton) {
      reset();
      return;
    }

    // Check numerator slider - check if clicking on or near the handle
    const handleHeight = 60;
    const handleY = numeratorSliderY - handleHeight / 2;

    // Allow clicking anywhere on the slider track OR near the handle
    const clickingOnTrack = (
      x >= SLIDER_X - 20 &&
      x <= SLIDER_X + SLIDER_WIDTH + 20 &&
      y >= BAR_Y &&
      y <= BAR_Y + BAR_HEIGHT
    );

    const clickingNearHandle = (
      x >= SLIDER_X - 30 &&
      x <= SLIDER_X + SLIDER_WIDTH + 30 &&
      y >= handleY - 20 &&
      y <= handleY + handleHeight + 20
    );

    if (clickingOnTrack || clickingNearHandle) {
      isDraggingNumerator = true;
      // Jump slider to clicked position for easier initial grab
      numeratorSliderY = Math.max(BAR_Y, Math.min(BAR_Y + BAR_HEIGHT, y));
      handleNumeratorMove(y);
    }
  }
}

// Handle touch/mouse move
function handleMove(x: number, y: number) {
  if (isDraggingDenominator) {
    handleDenominatorMove(y);
  } else if (isDraggingNumerator) {
    handleNumeratorMove(y);
  }
}

// Handle touch/mouse end
function handleEnd() {
  // Snap to nearest denominator threshold on release
  if (isDraggingDenominator) {
    const currentDenom = getDenominatorFromPosition(denominatorSliderY);
    const targetY = getSliderYFromDenominator(currentDenom);
    denominatorSliderY = targetY;
  }

  // Snap to nearest segment boundary on release
  if (isDraggingNumerator) {
    const currentNum = getNumeratorFromPosition(numeratorSliderY);
    // Snap to the top of the current segment
    const segmentHeight = BAR_HEIGHT / denominator;
    const targetY = BAR_Y + BAR_HEIGHT - (currentNum * segmentHeight);
    numeratorSliderY = targetY;
  }

  isDraggingDenominator = false;
  isDraggingNumerator = false;
}

// Handle denominator slider movement
function handleDenominatorMove(y: number) {
  denominatorSliderY = Math.max(BAR_Y, Math.min(BAR_Y + BAR_HEIGHT, y));
  const newDenominator = getDenominatorFromPosition(denominatorSliderY);

  // Snap effect: briefly pull slider to exact position
  if (newDenominator !== denominator) {
    const targetY = getSliderYFromDenominator(newDenominator);
    const diff = targetY - denominatorSliderY;
    denominatorSliderY += diff * 0.3; // Gentle snap
    denominator = newDenominator;
  }
}

// Handle numerator slider movement
function handleNumeratorMove(y: number) {
  numeratorSliderY = Math.max(BAR_Y, Math.min(BAR_Y + BAR_HEIGHT, y));
  numerator = getNumeratorFromPosition(numeratorSliderY);
}

// Event listeners
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  handleStart(x, y);
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  handleMove(x, y);
});

canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  handleStart(x, y);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  handleMove(x, y);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  handleEnd();
});

// Listen for capture requests from parent window
window.addEventListener('message', (event) => {
  if (event.data.type === 'capture') {
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      window.parent.postMessage(
        {
          type: 'captureResponse',
          imageData: imageData,
        },
        '*'
      );
      console.log('Fraction builder captured successfully');
    } catch (error) {
      console.error('Error capturing canvas:', error);
      window.parent.postMessage(
        {
          type: 'captureError',
          error: String(error),
        },
        '*'
      );
    }
  }
});

// Start render loop
render();
console.log('Fraction builder loaded. Drag down to select denominator, click GO, drag up to fill!');
