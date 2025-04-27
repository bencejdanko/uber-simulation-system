## Kong JWT Plugin: Downstream Claim Headers

**Overview**

The Kong JWT plugin has been configured to automatically extract claims from validated JWTs and inject them as individual HTTP headers into the request forwarded to upstream/downstream services. This provides easy access to user information and authorization details without requiring each service to parse the JWT itself.

**Header Format**

All injected headers follow this naming convention:

`X-Jwt-Claim-<claim_name>`

Where `<claim_name>` corresponds to the key of the claim within the JWT payload.

**Important Headers & Data Format**

While *all* simple claims are passed, these are particularly relevant:

1.  **User Identification:**
    *   **Header:** `X-Jwt-Claim-sub`
    *   **Content:** The User ID (subject claim from the JWT).
    *   **Format:** Plain String.
    *   **Usage:** Treat this value directly as the authenticated user's unique identifier.

2.  **User Roles/Authorization:**
    *   **Header:** `X-Jwt-Claim-roles` (or whatever claim name holds roles in your JWT)
    *   **Content:** An array of role strings assigned to the user.
    *   **Format:** **JSON Array String** (e.g., `["CUSTOMER"]`, `["RESTAURANT", "ADMIN"]`)
    *   **Usage:** You **must parse** this string value as JSON in your service code to get the actual array of roles before performing authorization checks.

3.  **Other Standard Claims:**
    *   `X-Jwt-Claim-iss` (Issuer): String
    *   `X-Jwt-Claim-exp` (Expiration Time): String (Unix timestamp)
    *   `X-Jwt-Claim-iat` (Issued At): String (Unix timestamp)
    *   *(Any other custom simple claims)*: String (numbers/booleans are converted to strings)

**Usage Example (Node.js / Express)**

```javascript
app.get('/api/some-endpoint', (req, res) => {
  const headers = req.headers; // Frameworks often normalize keys to lowercase

  // --- User ID ---
  // Note: HTTP headers are case-insensitive, but Node.js typically lowercases them.
  const userId = headers['x-jwt-claim-sub'];
  if (!userId) {
    return res.status(401).send('User ID not found in JWT claims.');
  }
  console.log(`Request from User ID: ${userId}`);

  // --- Roles ---
  const rolesHeader = headers['x-jwt-claim-roles'];
  let userRoles = [];
  if (rolesHeader) {
    try {
      userRoles = JSON.parse(rolesHeader);
      if (!Array.isArray(userRoles)) {
         throw new Error("Parsed roles is not an array");
      }
    } catch (e) {
      console.error(`Failed to parse roles header "${rolesHeader}":`, e.message);
      // Decide how to handle parsing errors - e.g., deny access or treat as no roles
      return res.status(500).send('Error processing user roles.');
    }
  } else {
    console.log('No roles claim found for user:', userId);
    // Treat as user having no specific roles, or deny access if roles are required
  }

  // --- Authorization Example ---
  const requiredRole = 'CUSTOMER';
  if (!userRoles.includes(requiredRole)) {
     console.log(`User ${userId} lacks required role: ${requiredRole}. Roles: ${userRoles.join(', ')}`);
     return res.status(403).send('Forbidden: Insufficient permissions.');
  }

  console.log(`User ${userId} has required role: ${requiredRole}`);
  // Proceed with protected logic...
  res.send(`Welcome, Customer ${userId}!`);
});
```

**Limitations**

*   **Serialization:** Only claims with simple types (string, number, boolean) and flat arrays of simple types are passed as headers. Nested objects or arrays containing complex types within the JWT will **not** be added as headers.
*   **Header Size:** Be mindful of potential header size limits if JWTs contain many large claims, though this is usually not an issue for standard claims.