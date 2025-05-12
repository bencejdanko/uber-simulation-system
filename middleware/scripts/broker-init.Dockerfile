FROM bitnami/kafka:3.5

USER root

# Create the initialization script
COPY create-topics.sh /opt/bitnami/kafka/bin/
RUN chmod +x /opt/bitnami/kafka/bin/create-topics.sh

# Switch back to non-root user
USER 1001

# Set the entrypoint to our script
ENTRYPOINT ["/opt/bitnami/kafka/bin/create-topics.sh"] 