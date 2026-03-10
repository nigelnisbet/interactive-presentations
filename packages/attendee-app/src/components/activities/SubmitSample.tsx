import React, { useState, useRef, useEffect } from 'react';
import { SubmitSampleActivity } from '@interactive-presentations/shared';
import { useSocket } from '../../contexts/FirebaseContext';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

// ST Math brand colors
const stMathBlue = '#0077c8';
const stMathBlueDark = '#005a9e';
const stMathOrange = '#f7941d';
const stMathGreen = '#4caf50';

type DrawMode = 'play' | 'draw';
type DrawTool = 'pen' | 'line' | 'circle' | 'rectangle' | 'arrow';

interface SubmitSampleProps {
  activity: SubmitSampleActivity;
}

export const SubmitSample: React.FC<SubmitSampleProps> = ({ activity }) => {
  const [mode, setMode] = useState<DrawMode>('play');
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawSize, setDrawSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [iframeScale, setIframeScale] = useState(1);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { submitResponse } = useSocket();

  // Initialize annotation canvas and calculate iframe scale
  useEffect(() => {
    if (annotationCanvasRef.current && containerRef.current) {
      const canvas = annotationCanvasRef.current;
      const container = containerRef.current;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Calculate scale for iframe content (assuming original size is 600x900)
      const scaleX = container.clientWidth / 600;
      const scaleY = container.clientHeight / 900;
      const scale = Math.min(scaleX, scaleY);
      setIframeScale(scale);
    }
  }, []);

  // Prevent body scrolling when in draw mode
  useEffect(() => {
    if (mode === 'draw') {
      // Prevent scrolling on touch devices
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mode]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw') return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    drawStartRef.current = coords;

    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawTool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== 'draw') return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (drawTool === 'pen') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (drawStartRef.current) {
      // For shapes, draw on temporary canvas to show preview
      if (!tempCanvasRef.current) {
        tempCanvasRef.current = document.createElement('canvas');
        tempCanvasRef.current.width = canvas.width;
        tempCanvasRef.current.height = canvas.height;
      }

      const tempCtx = tempCanvasRef.current.getContext('2d');
      if (!tempCtx) return;

      // Clear temp canvas
      tempCtx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw shape
      tempCtx.strokeStyle = drawColor;
      tempCtx.lineWidth = drawSize;
      tempCtx.lineCap = 'round';

      const startX = drawStartRef.current.x;
      const startY = drawStartRef.current.y;
      const width = coords.x - startX;
      const height = coords.y - startY;

      switch (drawTool) {
        case 'line':
          tempCtx.beginPath();
          tempCtx.moveTo(startX, startY);
          tempCtx.lineTo(coords.x, coords.y);
          tempCtx.stroke();
          break;

        case 'circle':
          const radius = Math.sqrt(width * width + height * height);
          tempCtx.beginPath();
          tempCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
          tempCtx.stroke();
          break;

        case 'rectangle':
          tempCtx.strokeRect(startX, startY, width, height);
          break;

        case 'arrow':
          drawArrow(tempCtx, startX, startY, coords.x, coords.y);
          break;
      }

      // Composite temp canvas onto main canvas for preview
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (tempCanvasRef.current) {
        ctx.drawImage(tempCanvasRef.current, 0, 0);
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const canvas = annotationCanvasRef.current;
    if (canvas && drawTool !== 'pen' && tempCanvasRef.current) {
      // Finalize shape drawing
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(tempCanvasRef.current, 0, 0);
      }
    }

    setIsDrawing(false);
    drawStartRef.current = null;
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 20;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const clearAnnotations = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const captureAndSubmit = async (_isUpdate: boolean = false) => {
    setSubmitting(true);

    try {
      // Request canvas capture from iframe
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) {
        throw new Error('Cannot access iframe');
      }

      // Send capture request to iframe
      iframe.contentWindow.postMessage(
        {
          type: 'capture',
          canvasSelector: activity.canvasSelector || 'canvas',
        },
        '*'
      );

      // Wait for response
      const capturePromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Capture timeout')), 5000);

        const handler = (event: MessageEvent) => {
          if (event.data.type === 'captureResponse') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data.imageData);
          }
        };

        window.addEventListener('message', handler);
      });

      const iframeImageData = await capturePromise;

      // Merge iframe canvas with annotations
      const mergedCanvas = document.createElement('canvas');
      const annotationCanvas = annotationCanvasRef.current;

      if (annotationCanvas) {
        mergedCanvas.width = annotationCanvas.width;
        mergedCanvas.height = annotationCanvas.height;

        const ctx = mergedCanvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get canvas context');

        // Draw iframe canvas
        const iframeImage = new Image();
        await new Promise((resolve, reject) => {
          iframeImage.onload = resolve;
          iframeImage.onerror = reject;
          iframeImage.src = iframeImageData;
        });

        ctx.drawImage(iframeImage, 0, 0, mergedCanvas.width, mergedCanvas.height);

        // Draw annotations on top
        if (activity.allowAnnotations) {
          ctx.drawImage(annotationCanvas, 0, 0);
        }
      }

      // Convert to base64
      const finalImageData = mergedCanvas.toDataURL('image/jpeg', 0.8);

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `submissions/${activity.activityId}/${timestamp}.jpg`;
      const imageRef = storageRef(storage, fileName);

      await uploadString(imageRef, finalImageData, 'data_url');
      const downloadURL = await getDownloadURL(imageRef);

      // Submit to server
      await submitResponse(activity.activityId || '', {
        imageUrl: downloadURL,
        version: submissionCount + 1,
        timestamp: new Date().toISOString(),
      });

      setSubmitted(true);
      setSubmissionCount((prev) => prev + 1);
    } catch (error) {
      console.error('Error submitting sample:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: stMathBlue,
        background: `linear-gradient(135deg, ${stMathBlue} 0%, ${stMathBlueDark} 100%)`,
      }}
    >
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-2">{activity.instructions}</h2>

        {/* Mode Toggle */}
        <div className="flex items-center space-x-2 mb-3">
          <button
            onClick={() => setMode('play')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              mode === 'play'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🎮 Play Mode
          </button>

          {activity.allowAnnotations && (
            <button
              onClick={() => setMode('draw')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                mode === 'draw'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ✏️ Draw Mode
            </button>
          )}
        </div>

        {/* Drawing Tools */}
        {activity.allowAnnotations && mode === 'draw' && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {/* Tool Selection */}
            <div className="flex space-x-1">
              {(['pen', 'line', 'circle', 'rectangle', 'arrow'] as DrawTool[]).map((tool) => (
                <button
                  key={tool}
                  onClick={() => setDrawTool(tool)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    drawTool === tool
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {tool === 'pen' && '✏️'}
                  {tool === 'line' && '📏'}
                  {tool === 'circle' && '⭕'}
                  {tool === 'rectangle' && '⬜'}
                  {tool === 'arrow' && '➡️'}
                </button>
              ))}
            </div>

            {/* Color Picker */}
            <div className="flex space-x-1">
              {['#000000', '#FF0000', '#0000FF', '#00AA00', '#FFA500'].map((color) => (
                <button
                  key={color}
                  onClick={() => setDrawColor(color)}
                  className={`w-8 h-8 rounded border-2 ${
                    drawColor === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Size Selector */}
            <select
              value={drawSize}
              onChange={(e) => setDrawSize(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={2}>Thin</option>
              <option value={4}>Medium</option>
              <option value={6}>Thick</option>
            </select>

            {/* Clear Button */}
            <button
              onClick={clearAnnotations}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
            >
              🗑️ Clear
            </button>
          </div>
        )}
      </div>

      {/* Activity Container */}
      <div className="flex-1 p-2 sm:p-4 flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative bg-white rounded-lg shadow-xl overflow-hidden"
          style={{
            width: 'min(600px, 95vw)',
            height: 'min(900px, calc(100vh - 220px))',
            maxWidth: '600px',
            maxHeight: '900px',
          }}
        >
          {/* Embedded Activity */}
          <iframe
            ref={iframeRef}
            src={activity.url}
            className="absolute"
            style={{
              pointerEvents: mode === 'play' ? 'auto' : 'none',
              width: '600px',
              height: '900px',
              border: 'none',
              transform: `scale(${iframeScale})`,
              transformOrigin: 'top left',
              left: 0,
              top: 0,
            }}
            title="Activity"
          />

          {/* Annotation Canvas */}
          {activity.allowAnnotations && (
            <canvas
              ref={annotationCanvasRef}
              className="absolute inset-0 w-full h-full"
              style={{
                pointerEvents: mode === 'draw' ? 'auto' : 'none',
                cursor: mode === 'draw' ? 'crosshair' : 'default',
                touchAction: mode === 'draw' ? 'none' : 'auto',
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="bg-white p-4 shadow-md">
        {!submitted ? (
          <button
            onClick={() => captureAndSubmit(false)}
            disabled={submitting}
            className="w-full py-3 px-6 rounded-lg font-semibold text-lg text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            style={{
              backgroundColor: submitting ? undefined : stMathOrange,
              boxShadow: submitting ? undefined : '0 4px 14px rgba(247, 148, 29, 0.4)',
            }}
          >
            {submitting ? 'Submitting...' : '📸 Submit My Work'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 px-6 py-3 rounded-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">
                Work Submitted! {submissionCount > 1 && `(Version ${submissionCount})`}
              </span>
            </div>

            {activity.allowMultipleSubmissions && (
              <button
                onClick={() => captureAndSubmit(true)}
                disabled={submitting}
                className="w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
                style={{
                  backgroundColor: stMathGreen,
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)',
                }}
              >
                {submitting ? 'Updating...' : '🔄 Submit Update'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
