// API utilities for TextLinker

export interface TextResponse {
  text: string;
}

export interface TokenResponse {
  token: string;
}

// Demo mode - works without backend server
const DEMO_MODE = true; // Set to false when connecting to real server
const SERVER_URL = DEMO_MODE ? '' : 'http://localhost:3002'; // Your server URL

// Simple token generator for demo mode
function generateDemoToken(): string {
  return Math.random().toString(36).substring(2, 8);
}

export const api = {
  // Generate a new token for device pairing
  generateToken: async (): Promise<string> => {
    if (DEMO_MODE) {
      // Demo mode - generate token locally
      return generateDemoToken();
    }
    
    try {
      const response = await fetch(`${SERVER_URL}/generate-token`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: TokenResponse = await response.json();
      return data.token;
    } catch (error) {
      console.error('Server not available, using demo mode:', error);
      return generateDemoToken();
    }
  },

  // Get text for a specific token
  getText: async (token: string): Promise<string | null> => {
    if (DEMO_MODE) {
      // Demo mode - return sample data
      const demoTexts = [
        `Meeting Notes\n\nDiscuss project timeline and deliverables for Q1 2024`,
        `Shopping List\n\nMilk, Bread, Eggs, Coffee, Bananas, Chicken`,
        `Ideas\n\nBuild a mobile app for text sharing\nImprove user interface\nAdd real-time sync`,
      ];
      return demoTexts.join('\n\n\n\n');
    }

    try {
      const response = await fetch(`${SERVER_URL}/text/${token}`);
      if (response.ok) {
        const data: TextResponse = await response.json();
        return data.text;
      }
      return null;
    } catch (error) {
      console.error('Error fetching text:', error);
      return null;
    }
  },

  // Send text to mobile app (new functionality)
  sendToPhone: async (token: string, text: string): Promise<boolean> => {
    if (DEMO_MODE) {
      // Demo mode - simulate successful send
      console.log(`Demo: Would send "${text}" to token ${token}`);
      return true;
    }

    try {
      const response = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, text }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending text to phone:', error);
      return false;
    }
  },
};