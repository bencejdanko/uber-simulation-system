#!/bin/bash

# Store private key
aws secretsmanager create-secret \
    --name auth-service/private-key \
    --description "Private key for JWT signing in auth service" \
    --secret-string "$(cat ../keys/private.pem)" \
    --region us-west-2

# Store public key
aws secretsmanager create-secret \
    --name auth-service/public-key \
    --description "Public key for JWT verification in auth service" \
    --secret-string "$(cat ../keys/public.pem)" \
    --region us-west-2 