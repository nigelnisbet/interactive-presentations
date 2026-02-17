import fs from 'fs/promises';
import path from 'path';
import { PresentationConfig, ActivityConfig } from '@interactive-presentations/shared';

export class ActivityLoader {
  private activitiesPath: string;
  private cache: Map<string, PresentationConfig> = new Map();

  constructor(activitiesPath: string = path.join(__dirname, '../../activities')) {
    this.activitiesPath = activitiesPath;
  }

  async loadPresentationConfig(presentationId: string): Promise<PresentationConfig | null> {
    // Check cache first
    if (this.cache.has(presentationId)) {
      return this.cache.get(presentationId)!;
    }

    try {
      const configPath = path.join(this.activitiesPath, presentationId, 'config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content) as PresentationConfig;

      // Validate basic structure
      if (!config.presentationId || !config.activities) {
        throw new Error('Invalid presentation config structure');
      }

      // Cache it
      this.cache.set(presentationId, config);
      return config;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log(`No activity config found for presentation: ${presentationId}`);
        return null;
      }
      console.error(`Error loading presentation config for ${presentationId}:`, error);
      return null;
    }
  }

  async getActivities(presentationId: string): Promise<ActivityConfig[]> {
    const config = await this.loadPresentationConfig(presentationId);
    return config?.activities || [];
  }

  clearCache(presentationId?: string): void {
    if (presentationId) {
      this.cache.delete(presentationId);
    } else {
      this.cache.clear();
    }
  }
}
