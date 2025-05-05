# Use a base image that has shell and Kafka client tools
FROM apache/kafka:latest

# Set the working directory
WORKDIR /opt/kafka

# Copy the script from the build context into the image
# Ensure the script has execute permissions
COPY broker-init.sh /opt/kafka/broker-init.sh
# RUN chmod +x /opt/kafka/broker-init.sh

# The entrypoint will be set in docker-compose.yml to run this script