// This should be your local development IP address to connect to the local database
export const config = {
  // Local development IP address for Expo
  API_BASE: process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api/v1` : 'http://localhost:3000/api/v1',
  
  // Use Vercel URL for production
  // API_BASE: 'https://med-qs0.vercel.app/api/v1',
};
