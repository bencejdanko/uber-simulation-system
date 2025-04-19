# Variables
# Assuming the JWKS endpoint is at the root or /.well-known/
# Adjust the path if src/api/routes/jwks.routes.ts defines it differently
PORT=3000 # Replace with your actual port
JWKS_URL="http://localhost:$PORT/.well-known/jwks.json" # Or adjust path

# Request
curl -X GET "$JWKS_URL"