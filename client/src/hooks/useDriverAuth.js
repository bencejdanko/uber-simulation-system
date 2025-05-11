import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const useDriverAuth = (tokenKey = 'accessToken', loginPath = '/login-driver') => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // True when the check is complete
  const [error, setError] = useState(null); // Stores any authentication error

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    let currentUserId = null;
    let authError = null;

    if (token) {
      try {
        const decodedToken = jwtDecode(token);

        if (decodedToken.exp * 1000 < Date.now()) {
          console.error(`Token from '${tokenKey}' has expired.`);
          localStorage.removeItem(tokenKey);
          authError = "Your session has expired. Please log in again.";
          navigate(loginPath, { replace: true });
        } else if (decodedToken && decodedToken.sub) {
          // Role validation
          if (decodedToken.roles && Array.isArray(decodedToken.roles) && decodedToken.roles.includes('DRIVER')) {
            currentUserId = decodedToken.sub;
          } else {
            console.error(`Token from '${tokenKey}' does not have the required 'DRIVER' role or 'roles' claim is invalid.`);
            localStorage.removeItem(tokenKey);
            authError = "Access denied. Invalid user role for this section.";
            navigate(loginPath, { replace: true }); // Or a generic error page/home page
          }
        } else {
          console.error(`JWT 'sub' claim not found in decoded token from '${tokenKey}'.`);
          localStorage.removeItem(tokenKey);
          authError = "Invalid token structure. Please log in again.";
          navigate(loginPath, { replace: true });
        }
      } catch (err) {
        console.error(`Failed to decode JWT or token from '${tokenKey}' is invalid:`, err);
        localStorage.removeItem(tokenKey);
        authError = "Invalid session token. Please log in again.";
        navigate(loginPath, { replace: true });
      }
    } else {
      // No token found
      // authError = "No active session. Please log in."; // This message might not be seen if navigation happens immediately
      navigate(loginPath, { replace: true });
    }

    setUserId(currentUserId);
    setError(authError);
    setAuthChecked(true); // Mark authentication check as complete

  // Adding navigate, tokenKey, and loginPath to dependencies
  // ensures the effect re-runs if these somehow change, though typically they won't.
  }, [navigate, tokenKey, loginPath]);

  return { userId, authChecked, error };
};

export default useDriverAuth;