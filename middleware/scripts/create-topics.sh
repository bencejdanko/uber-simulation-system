#!/bin/bash

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 30

# Create topics
echo "Creating topics..."

# Auth Service Topics
kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic user-created \
    --partitions 3 \
    --replication-factor 1

kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic user-updated \
    --partitions 3 \
    --replication-factor 1

kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic user-deleted \
    --partitions 3 \
    --replication-factor 1

# Ride Service Topics
kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic ride-requested \
    --partitions 3 \
    --replication-factor 1

kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic ride-accepted \
    --partitions 3 \
    --replication-factor 1

kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic ride-started \
    --partitions 3 \
    --replication-factor 1

kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic ride-completed \
    --partitions 3 \
    --replication-factor 1

kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic ride-cancelled \
    --partitions 3 \
    --replication-factor 1

# Billing Service Topics
kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic payment-processed \
    --partitions 3 \
    --replication-factor 1

kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic payment-failed \
    --partitions 3 \
    --replication-factor 1

# Review Service Topics
kafka-topics.sh --create --if-not-exists \
    --bootstrap-server kafka-broker:29092 \
    --topic review-submitted \
    --partitions 3 \
    --replication-factor 1

echo "Topics created successfully!" 