# Start the middleware services

```bash
# docker-compose build # necessary if you change the services

docker-compose up
```

Alternatively, take down the services

```bash
docker-compose down

docker-compose down -v # delete data stored in volumes
docker-compose down -v --remove-orphans # delete old containers, clean slate

docker-compose up --force-recreate
```

## Kafka

Note that compose enviroment is configured to automatically create the relevant topics.