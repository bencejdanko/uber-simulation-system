// extractClaims.js
import { jwtDecode } from 'jwt-decode';

// Function to extract: "sub", "roles" from the JWT token
export const extractClaims = (token) => {
  if (!token) return null;

  try {
    const decodedToken = jwtDecode(token);
    const { sub, roles } = decodedToken;

    return { sub, roles };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};