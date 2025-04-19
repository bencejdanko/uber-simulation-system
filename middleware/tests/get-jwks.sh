# --- TEST JWKS Endpoint via KONG ---

KONG_PROXY_PORT=8000
JWKS_URL="http://localhost:$KONG_PROXY_PORT/.well-known/jwks.json"

echo "\nTesting JWKS endpoint via Kong..."
curl "$JWKS_URL"

# Expected Outcome:
# Should return the same JWKS JSON as before. Confirms routing for this path.