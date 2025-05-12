# Use Bitnami's Kafka image as base
FROM bitnami/kafka:3.5

USER root
COPY broker-init.sh /app/broker-init.sh
RUN chmod +x /app/broker-init.sh
USER 1001

# Set the working directory
WORKDIR /opt/bitnami/kafka

# Set the entrypoint to our initialization script
ENTRYPOINT ["/app/broker-init.sh"]