// API utilities for TextLinker

export interface TextResponse {
  text: string;
}

export interface TokenResponse {
  token: string;
}

export const api = {
  // Generate a new token for device pairing
  generateToken: async (): Promise<string> => {
    const response = await fetch('/generate-token');
    const data: TokenResponse = await response.json();
    return data.token;
  },

  // Get text for a specific token
  getText: async (token: string): Promise<string | null> => {
    try {
      const response = await fetch(`/text/${token}`);
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
    try {
      const response = await fetch('/upload', {
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