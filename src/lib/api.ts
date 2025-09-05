// API utilities for TextLinker

export interface TextResponse {
  text: string;
}

export interface TokenResponse {
  token: string;
}

// Production mode - connects to your real server
const DEMO_MODE = false; // Ensure we hit the real server when available

// Prefer HTTPS when the app runs over HTTPS to avoid mixed-content blocking
const resolveServerUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    // Try HTTPS domain first; your server/proxy should present a valid TLS cert and CORS
    return 'https://api.textlinker.pro';
  }
  return 'http://129.153.161.57:3002';
};
// Simple token generator for demo mode
function generateDemoToken(): string {
  return Math.random().toString(36).substring(2, 8);
}

// Small helper to add timeouts and ensure CORS
async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }) {
  const timeoutMs = init?.timeoutMs ?? 8000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { timeoutMs: _ignored, ...rest } = init || {} as any;
    return await fetch(input, { ...rest, mode: 'cors', signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  // Generate a new token for device pairing
  generateToken: async (): Promise<string> => {
    if (DEMO_MODE) {
      // Demo mode - generate token locally
      return generateDemoToken();
    }
    
    try {
      const base = resolveServerUrl();
      const response = await fetchWithTimeout(`${base}/generate-token`, { timeoutMs: 8000 });
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
      const base = resolveServerUrl();
      const response = await fetchWithTimeout(`${base}/text/${token}`, { timeoutMs: 8000 });
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
      const base = resolveServerUrl();
      const response = await fetchWithTimeout(`${base}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, text }),
        timeoutMs: 8000,
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending text to phone:', error);
      return false;
    }
  },
};