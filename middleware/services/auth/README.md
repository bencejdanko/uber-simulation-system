## Ensure that you have the Kafka instance running

`/middleware/installations/docker-compose-yml`

## Key generation

```bash
# generate a key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# convert to base64
echo 'ACCESS_TOKEN_PRIVATE_KEY_BASE64='`base64 -w 0 private.pem` >> .env.tmp
echo 'ACCESS_TOKEN_PUBLIC_KEY_BASE64='`base64 -w 0 public.pem` >> .env.tmp
```

## Ensure the right topic is created

```bash
docker exec -it middleware_kafka_1 /opt/bitnami/kafka/bin/kafka-topics.sh --create --topic user.registered --bootstrap-server localhost:9094 --partitions 1 --replication-factor 1
```

## Copy .env.template, and fill out the variables correctly