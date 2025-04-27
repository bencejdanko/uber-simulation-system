
# Middlewares

## READ THIS before starting!

### Key generation

Our authentication setup requires a `public.pem` and `private.pem` for asymmetric JWT (JSON Web Token) signing and verification.

```bash
# create a 'keys directory'
mkdir keys

# generate a key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

### .env configuration

Copy the `.env.template` file and rename as `.env`. Replace with your desired configuration.

## Start the middleware services

```bash
docker-compose up

# Optionally:
docker-compose up --build # Necessary if service code changes
```

## Stop the middleware services
Alternatively, take down the services

```bash
docker-compose down

# Optionally:
docker-compose down -v # delete data stored in volumes
docker-compose down -v --remove-orphans # delete old containers, clean slate
```

---

# DEVELOPERS

