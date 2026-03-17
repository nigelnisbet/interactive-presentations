/**
 * Personal Session Configuration
 *
 * Configuration is now stored in Chrome storage and managed via the options page.
 * This provides a fallback/default configuration.
 */

export interface PersonalSessionConfig {
  enabled: boolean;
  teamMemberName: string;
  sessionCode: string;
  presentationId: string;
}

// Default/fallback configuration (used if nothing configured in Chrome storage)
const defaultConfig: PersonalSessionConfig = {
  enabled: false,
  teamMemberName: '',
  sessionCode: '',
  presentationId: 'conversation-tool',
};

let cachedConfig: PersonalSessionConfig | null = null;

/**
 * Load configuration from Chrome storage
 * Always loads fresh from storage (no caching) to pick up changes immediately
 */
async function loadConfig(): Promise<PersonalSessionConfig> {
  try {
    const result = await chrome.storage.local.get(['personalSessionConfig']);
    if (result.personalSessionConfig) {
      return result.personalSessionConfig;
    }
  } catch (error) {
    console.error('[Interactive Presentations] Error loading config from storage:', error);
  }

  return defaultConfig;
}

/**
 * Check if we should use personal session mode for this presentation
 */
export async function shouldUsePersonalSession(presentationId: string): Promise<boolean> {
  const config = await loadConfig();
  return (
    config.enabled &&
    config.sessionCode.length > 0 &&
    config.presentationId === presentationId
  );
}

/**
 * Get the personal session code for this team member
 */
export async function getPersonalSessionCode(): Promise<string | null> {
  const config = await loadConfig();
  if (!config.enabled || !config.sessionCode) {
    return null;
  }
  return config.sessionCode;
}

/**
 * Get the team member name for generating friendly URLs
 */
export async function getTeamMemberName(): Promise<string | null> {
  const config = await loadConfig();
  if (!config.enabled || !config.teamMemberName) {
    return null;
  }
  return config.teamMemberName;
}
