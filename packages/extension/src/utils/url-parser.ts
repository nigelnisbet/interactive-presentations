/**
 * Extract presentation ID from slides.com URL
 */
export function extractPresentationId(url: string): string {
  try {
    // Extract presentation ID from URL
    // Format: https://mind.slides.com/jedmiston/conversation-tool/fullscreen
    const urlParts = url.split('/');

    // Check for /d/ format (mind.slides.com/d/ID/...)
    const dIndex = urlParts.indexOf('d');
    if (dIndex !== -1 && dIndex < urlParts.length - 1) {
      return urlParts[dIndex + 1];
    }

    // Fall back to presentation name (excluding special paths and fragments)
    const cleanUrl = url.split('#')[0].split('?')[0];
    const parts = cleanUrl.split('/').filter(p => p && p !== 'fullscreen' && p !== 'live' && p !== 'embed');

    // For mind.slides.com/username/presentation-name format
    // We want the last part before any special paths
    if (parts.length >= 3 && parts[0].includes('slides.com')) {
      // parts = ['mind.slides.com', 'jedmiston', 'conversation-tool']
      return parts[parts.length - 1];
    }

    return parts[parts.length - 1] || 'default-presentation';
  } catch (error) {
    console.error('[Interactive Presentations] Error parsing URL:', error);
    return 'default-presentation';
  }
}
