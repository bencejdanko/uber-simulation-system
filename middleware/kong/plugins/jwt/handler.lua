-- <jwt handler.lua>
local constants = require "kong.constants"
local jwt_decoder = require "kong.plugins.jwt.jwt_parser"
local kong_meta = require "kong.meta"


local fmt = string.format
local kong = kong
local type = type
local error = error
local ipairs = ipairs
local pairs = pairs
local tostring = tostring
local table_concat = table.concat -- Cache table.concat
local table_insert = table.insert -- Cache table.insert
local string_gsub = string.gsub -- Cache string.gsub
local re_gmatch = ngx.re.gmatch


local JwtHandler = {
  VERSION = "3.10.0", -- NOTE: Keep version aligned if needed, but code is modified
  PRIORITY = 1450,
}


--- Retrieve a JWT in a request.
-- Checks for the JWT in URI parameters, then in cookies, and finally
-- in the configured header_names (defaults to `[Authorization]`).
-- @param conf Plugin configuration
-- @return token JWT token contained in request (can be a table) or nil
-- @return err
local function retrieve_tokens(conf)
  local token_set = {}
  local args = kong.request.get_query()
  for _, v in ipairs(conf.uri_param_names) do
    local token = args[v] -- can be a table
    if token then
      if type(token) == "table" then
        for _, t in ipairs(token) do
          if t ~= "" then
            token_set[t] = true
          end
        end

      elseif token ~= "" then
        token_set[token] = true
      end
    end
  end

  local var = ngx.var
  for _, v in ipairs(conf.cookie_names) do
    local cookie = var["cookie_" .. v]
    if cookie and cookie ~= "" then
      token_set[cookie] = true
    end
  end

  local request_headers = kong.request.get_headers()
  for _, v in ipairs(conf.header_names) do
    local token_header = request_headers[v]
    if token_header then
      if type(token_header) == "table" then
        -- Handle potential multiple headers with the same name
        for _, header_val in ipairs(token_header) do
            local iterator, iter_err = re_gmatch(header_val, "\\s*[Bb]earer\\s+(.+)", "jo")
            if not iterator then
              kong.log.err("Regex error matching Bearer token: ", iter_err)
              -- Continue to next header value if possible
            else
              local m, err = iterator()
              if err then
                kong.log.err("Error executing regex iterator for Bearer token: ", err)
                -- Continue to next header value if possible
              elseif m and #m > 0 then
                if m[1] ~= "" then
                  token_set[m[1]] = true
                end
              end
            end
        end
      else -- Single header value
        local iterator, iter_err = re_gmatch(token_header, "\\s*[Bb]earer\\s+(.+)", "jo")
        if not iterator then
          kong.log.err("Regex error matching Bearer token: ", iter_err)
          -- Break might be too strong if other header names are configured
        else
          local m, err = iterator()
          if err then
            kong.log.err("Error executing regex iterator for Bearer token: ", err)
            -- Break might be too strong
          elseif m and #m > 0 then
            if m[1] ~= "" then
              token_set[m[1]] = true
            end
          end
        end
      end
    end
  end

  local tokens_n = 0
  local tokens = {}
  for token, _ in pairs(token_set) do
    tokens_n = tokens_n + 1
    tokens[tokens_n] = token
  end

  if tokens_n == 0 then
    return nil
  end

  if tokens_n == 1 then
    return tokens[1]
  end

  return tokens
end


local function load_credential(jwt_secret_key)
  local row, err = kong.db.jwt_secrets:select_by_key(jwt_secret_key)
  if err then
    return nil, err
  end
  return row
end


-- ***** MODIFICATION START *****
-- Modified 'set_consumer' to serialize array claims as JSON strings
local function set_consumer(consumer, credential, token, claims)
-- ***** MODIFICATION CONTINUES BELOW *****

  kong.client.authenticate(consumer, credential)

  local set_header = kong.service.request.set_header
  local clear_header = kong.service.request.clear_header

  if consumer and consumer.id then
    set_header(constants.HEADERS.CONSUMER_ID, consumer.id)
  else
    clear_header(constants.HEADERS.CONSUMER_ID)
  end

  if consumer and consumer.custom_id then
    set_header(constants.HEADERS.CONSUMER_CUSTOM_ID, consumer.custom_id)
  else
    clear_header(constants.HEADERS.CONSUMER_CUSTOM_ID)
  end

  if consumer and consumer.username then
    set_header(constants.HEADERS.CONSUMER_USERNAME, consumer.username)
  else
    clear_header(constants.HEADERS.CONSUMER_USERNAME)
  end

  if credential and credential.key then
    set_header(constants.HEADERS.CREDENTIAL_IDENTIFIER, credential.key)
  else
    clear_header(constants.HEADERS.CREDENTIAL_IDENTIFIER)
  end

  if credential then
    clear_header(constants.HEADERS.ANONYMOUS)
  else
    set_header(constants.HEADERS.ANONYMOUS, true)
  end

  -- ***** MODIFICATION CORE LOGIC *****
  -- Helper function (inline for simplicity) to escape JSON strings
  local function escape_json_string(str)
      local escaped = string_gsub(str, "\\", "\\\\") -- Escape backslashes first
      escaped = string_gsub(escaped, "\"", "\\\"") -- Escape double quotes
      -- Basic escaping for common control characters (optional but good practice)
      -- escaped = string_gsub(escaped, "\n", "\\n")
      -- escaped = string_gsub(escaped, "\r", "\\r")
      -- escaped = string_gsub(escaped, "\t", "\\t")
      -- escaped = string_gsub(escaped, "\f", "\\f")
      -- escaped = string_gsub(escaped, "\b", "\\b")
      return escaped
  end

  -- Add JWT claims to upstream headers
  if claims then
    kong.log.debug("Adding JWT claims to upstream headers")
    for key, value in pairs(claims) do
      local header_name = "X-Jwt-Claim-" .. key
      local header_value = nil
      local value_type = type(value)

      if value_type == "string" or value_type == "number" or value_type == "boolean" then
        -- Handle simple types directly (remain unchanged)
        header_value = tostring(value)

      elseif value_type == "table" then
        -- Attempt to serialize simple arrays as JSON strings.
        -- Uses ipairs, so only handles sequential arrays starting at index 1.
        -- Does NOT handle nested tables or dictionary-like tables.
        local parts = {}
        local success = true
        for i, element in ipairs(value) do
            local element_type = type(element)
            local formatted_element

            if element_type == "string" then
                formatted_element = '"' .. escape_json_string(element) .. '"'
            elseif element_type == "number" then
                formatted_element = tostring(element) -- JSON numbers are direct strings
            elseif element_type == "boolean" then
                formatted_element = tostring(element) -- Lua tostring(true) is "true"
            else
                -- Found a non-simple type within the array. Cannot serialize reliably.
                kong.log.warn("Skipping JWT claim '", key, "' for header propagation. Found non-serializable element of type '", element_type, "' at index ", i, " in table.")
                success = false
                break -- Stop processing this table
            end
            table_insert(parts, formatted_element)
        end

        if success then
             -- Construct JSON array string: "[elem1,elem2,...]"
             header_value = "[" .. table_concat(parts, ",") .. "]"
        else
            -- Ensure header_value remains nil if serialization failed
            header_value = nil
        end

      else
        -- Handle other potential types if needed, or just warn
        kong.log.warn("Skipping JWT claim '", key, "' for header propagation as its type is '", value_type, "' (not string, number, boolean, or serializable array)")
      end

      -- Set the header only if a serializable value was determined
      if header_value ~= nil then
         kong.log.debug("Setting header ", header_name, " with value: '", header_value, "'")
         set_header(header_name, header_value)
      end
    end
  end
  -- ***** MODIFICATION END *****

  kong.ctx.shared.authenticated_jwt_token = token -- TODO: wrap in a PDK function?
end


local function unauthorized(message, www_auth_content, errors)
  return { status = 401, message = message, headers = { ["WWW-Authenticate"] = www_auth_content }, errors = errors }
end


local function do_authentication(conf)
  local token, err = retrieve_tokens(conf)
  if err then
    kong.log.err("Error retrieving tokens: ", err)
    return false, unauthorized("Error retrieving token", conf.realm and fmt('Bearer realm="%s"', conf.realm) or 'Bearer')
  end

  local www_authenticate_base = conf.realm and fmt('Bearer realm="%s"', conf.realm) or 'Bearer'
  local www_authenticate_with_error = www_authenticate_base .. ' error="invalid_token"'
  local token_type = type(token)
  if token_type ~= "string" then
    if token_type == "nil" then
      return false, unauthorized("Unauthorized", www_authenticate_base)
    elseif token_type == "table" then
      return false, unauthorized("Multiple tokens provided", www_authenticate_with_error)
    else
      kong.log.warn("Unrecognizable token type received: ", token_type)
      return false, unauthorized("Unrecognizable token format", www_authenticate_with_error)
    end
  end

  -- Decode token to find out who the consumer is
  local jwt, err = jwt_decoder:new(token)
  if err then
    return false, unauthorized("Bad token; " .. tostring(err), www_authenticate_with_error)
  end

  local claims = jwt.claims
  local header = jwt.header

  local jwt_secret_key = claims[conf.key_claim_name] or header[conf.key_claim_name]
  if not jwt_secret_key then
    return false, unauthorized("No mandatory '" .. conf.key_claim_name .. "' claim found in token payload or header", www_authenticate_with_error)
  elseif jwt_secret_key == "" then
    return false, unauthorized("Invalid (empty) '" .. conf.key_claim_name .. "' claim in token", www_authenticate_with_error)
  end

  -- Retrieve the secret
  local jwt_secret_cache_key = kong.db.jwt_secrets:cache_key(jwt_secret_key)
  local jwt_secret, err      = kong.cache:get(jwt_secret_cache_key, nil,
                                              load_credential, jwt_secret_key)
  if err then
    kong.log.err("Error loading JWT secret for key '", jwt_secret_key, "': ", err)
    return false, { status = 500, message = "Error retrieving credential information" }
  end

  if not jwt_secret then
    return false, unauthorized(fmt("No credential found for key claim value '%s'", jwt_secret_key), www_authenticate_with_error)
  end

  local algorithm = jwt_secret.algorithm or "HS256"

  -- Verify "alg"
  if jwt.header.alg ~= algorithm then
    return false, unauthorized(fmt("Invalid algorithm specified in token. Expected '%s', got '%s'", algorithm, jwt.header.alg or "nil"), www_authenticate_with_error)
  end

  local is_symmetric_algorithm = algorithm ~= nil and algorithm:sub(1, 2) == "HS"
  local jwt_secret_value

  if is_symmetric_algorithm and conf.secret_is_base64 then
    local ok
    ok, jwt_secret_value = pcall(jwt.base64_decode, jwt_secret.secret) -- Use pcall for safety
    if not ok then
       kong.log.err("Failed to base64 decode secret for key: ", jwt_secret_key)
       return false, unauthorized("Invalid credential configuration (secret decoding failed)", www_authenticate_with_error)
    end
  elseif is_symmetric_algorithm then
    jwt_secret_value = jwt_secret.secret
  else
    -- Asymmetric (RS*/ES*)
    jwt_secret_value = jwt_secret.rsa_public_key
  end

  if not jwt_secret_value then
    return false, unauthorized("Credential configuration is missing required key/secret value", www_authenticate_with_error)
  end

  -- Now verify the JWT signature
  local sig_ok, sig_err = jwt:verify_signature(jwt_secret_value)
  if not sig_ok then
    kong.log.warn("JWT signature verification failed for key '", jwt_secret_key, "'. Error: ", tostring(sig_err))
    return false, unauthorized("Invalid signature", www_authenticate_with_error)
  end

  -- Verify the JWT registered claims
  local ok_claims, errors = jwt:verify_registered_claims(conf.claims_to_verify)
  if not ok_claims then
    return false, unauthorized(nil, www_authenticate_with_error, errors)
  end

  -- Verify the JWT maximum expiration claim
  if conf.maximum_expiration ~= nil and conf.maximum_expiration > 0 then
    local ok, errors = jwt:check_maximum_expiration(conf.maximum_expiration)
    if not ok then
      return false, unauthorized(nil, www_authenticate_with_error, errors)
    end
  end

  -- Retrieve the consumer
  local consumer_cache_key = kong.db.consumers:cache_key(jwt_secret.consumer.id)
  local consumer, err      = kong.cache:get(consumer_cache_key, nil,
                                            kong.client.load_consumer,
                                            jwt_secret.consumer.id, true)
  if err then
    kong.log.err("Error loading consumer '", jwt_secret.consumer.id, "' for JWT credential '", jwt_secret_key, "': ", err)
    return false, { status = 500, message = "Error retrieving consumer information" }
  end

  -- However this should not happen if DB integrity is maintained
  if not consumer then
    kong.log.err("Consumer ID '", jwt_secret.consumer.id, "' associated with JWT credential '", jwt_secret_key, "' not found.")
    return false, {
      status = 500, -- Internal server error because data is inconsistent
      message = fmt("Could not find consumer associated with credential key '%s'", jwt_secret_key)
    }
  end

  -- Pass the decoded 'claims' table to set_consumer
  set_consumer(consumer, jwt_secret, token, claims)

  return true
end


local function set_anonymous_consumer(anonymous)
  local consumer_cache_key = kong.db.consumers:cache_key(anonymous)
  local consumer, err = kong.cache:get(consumer_cache_key, nil,
                                        kong.client.load_consumer,
                                        anonymous, true)
  if err then
    kong.log.err("Error loading anonymous consumer '", anonymous, "': ", err)
    return kong.response.error(500, "Error retrieving anonymous consumer information")
  end

  if not consumer then
    local err_msg = "anonymous consumer " .. anonymous .. " is configured but doesn't exist"
    kong.log.err(err_msg)
    return kong.response.error(500, err_msg)
  end

  -- Pass nil for credential, token, and claims for anonymous consumer
  set_consumer(consumer, nil, nil, nil) -- Passing nil for claims here is correct
end


--- When conf.anonymous is enabled we are in "logical OR" authentication flow.
local function logical_OR_authentication(conf)
  if kong.client.get_credential() then
    return
  end

  local ok, _ = do_authentication(conf)
  if not ok then
    set_anonymous_consumer(conf.anonymous)
  end
end

--- When conf.anonymous is not set we are in "logical AND" authentication flow.
local function logical_AND_authentication(conf)
  local ok, err_resp = do_authentication(conf)
  if not ok then
    return kong.response.exit(err_resp.status, err_resp.errors or { message = err_resp.message }, err_resp.headers)
  end
end


function JwtHandler:access(conf)
  if not conf.run_on_preflight and kong.request.get_method() == "OPTIONS" then
    return
  end

  if conf.anonymous then
    return logical_OR_authentication(conf)
  else
    return logical_AND_authentication(conf)
  end
end

-- Add this new function for the header_filter phase
function JwtHandler:header_filter(conf)
  -- Always set the origin. For production, consider making this configurable
  -- instead of using a wildcard.
  kong.response.set_header("Access-Control-Allow-Origin", conf.cors_origin or "*")

  if kong.request.get_method() == "OPTIONS" then
    -- Handle Preflight (OPTIONS) requests
    kong.response.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
    kong.response.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With") -- Add any other headers your client might send
    kong.response.set_header("Access-Control-Max-Age", "3600") -- Optional: caches preflight response for 1 hour

    -- For OPTIONS requests, we should send a 204 No Content response and exit.
    -- This indicates the preflight request was successful.
    return kong.response.exit(204)
  end

  -- For actual requests (non-OPTIONS), the Access-Control-Allow-Origin is already set.
  -- Other CORS headers like Access-Control-Expose-Headers might be set here if needed,
  -- depending on what headers your client-side JavaScript needs to access.
end

return JwtHandler