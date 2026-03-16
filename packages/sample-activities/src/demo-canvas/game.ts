// Demo Canvas Activity
// This demonstrates how to create a canvas-based activity that can be captured
// by the submit-sample component

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreElement = document.getElementById('score')!;
const clearBtn = document.getElementById('clear-btn')!;
const randomBtn = document.getElementById('random-btn')!;

let circleCount = 0;
let useRandomColors = false;

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7B731', '#5F27CD', '#00D2D3',
  '#FF9FF3', '#54A0FF', '#48DBFB', '#1DD1A1'
];

// Initialize canvas with a nice background
function initCanvas() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f5f5f5');
  gradient.addColorStop(1, '#e0e0e0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw a circle at the given position
function drawCircle(x: number, y: number) {
  const radius = 20 + Math.random() * 30;
  const color = useRandomColors
    ? `hsl(${Math.random() * 360}, 70%, 60%)`
    : colors[Math.floor(Math.random() * colors.length)];

  // Draw shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Draw circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Add highlight
  const highlight = ctx.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.3,
    0,
    x,
    y,
    radius
  );
  highlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  circleCount++;
  updateScore();
}

function updateScore() {
  scoreElement.textContent = `Circles: ${circleCount}`;
}

function clearCanvas() {
  initCanvas();
  circleCount = 0;
  updateScore();
}

// Handle canvas clicks
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  drawCircle(x, y);
});

// Handle clear button
clearBtn.addEventListener('click', clearCanvas);

// Handle random colors toggle
randomBtn.addEventListener('click', () => {
  useRandomColors = !useRandomColors;
  randomBtn.textContent = useRandomColors ? 'Fixed Colors' : 'Random Colors';
  randomBtn.style.background = useRandomColors ? '#764ba2' : '#667eea';
});

// Listen for capture requests from parent window (submit-sample component)
window.addEventListener('message', (event) => {
  if (event.data.type === 'capture') {
    try {
      // Capture the canvas as a data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      // Send back to parent
      window.parent.postMessage(
        {
          type: 'captureResponse',
          imageData: imageData,
        },
        '*'
      );

      console.log('Canvas captured successfully');
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

// Initialize
initCanvas();
console.log('Demo canvas activity loaded. Ready for capture via postMessage.');
