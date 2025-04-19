## Ensure that you have the Kafka instance running

`/middleware/installations/docker-compose-yml`

## Key generation

```bash
# generate a key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

## Ensure the right topic is created

```bash
docker exec -it middleware_kafka_1 /opt/bitnami/kafka/bin/kafka-topics.sh --create --topic user.registered --bootstrap-server localhost:9094 --partitions 1 --replication-factor 1
```

## Copy .env.template, and fill out the variables correctly

# Testing

Run the `/tests` scripts to create and login users.

To confirm Kafka integration, read from the Kafka topic:

```bash
docker exec -it middleware_kafka_1 /opt/bitnami/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9094 \
  --topic user.registered \
  --from-beginning
```

Confirm existence of new registrations in the MongoDB collections