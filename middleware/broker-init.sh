#!/bin/sh

# DO NOT use 'set -e' here; we want to attempt all topics and report overall status.

# --- Configuration ---
MAX_RETRIES=${KAFKA_MAX_RETRIES:-12}
RETRY_INTERVAL=${KAFKA_RETRY_INTERVAL:-5}
BOOTSTRAP_SERVER=${KAFKA_BOOTSTRAP_SERVER:-"broker:29092"} # Internal listener

# Topic Configuration - Read from environment variable
# Format: "topic1:partitions:replicas,topic2,topic3:partitions:replicas"
# If partitions:replicas are omitted, defaults are used.
KAFKA_CREATE_TOPICS=${KAFKA_CREATE_TOPICS:-""}
# Defaults used when partitions/replicas are not specified for a topic
DEFAULT_PARTITIONS=${KAFKA_DEFAULT_PARTITIONS:-3}
DEFAULT_REPLICATION_FACTOR=${KAFKA_DEFAULT_REPLICATION_FACTOR:-1}

# Define the path to Kafka tools
KAFKA_BIN_DIR="/opt/kafka/bin"
# --- End Configuration ---

echo "Kafka Init Script: Starting..."
echo "Kafka Init Script: Target Broker: $BOOTSTRAP_SERVER"
echo "Kafka Init Script: Default Partitions: $DEFAULT_PARTITIONS"
echo "Kafka Init Script: Default Replication Factor: $DEFAULT_REPLICATION_FACTOR"
echo "Kafka Init Script: Topic configurations to process: ${KAFKA_CREATE_TOPICS:-'(None specified)'}"

# --- Check if there are topics to create ---
if [ -z "$KAFKA_CREATE_TOPICS" ]; then
  echo "Kafka Init Script: No topics specified in KAFKA_CREATE_TOPICS environment variable. Exiting."
  exit 0
fi

# --- Wait for Broker ---
retries=0
echo "Kafka Init Script: Waiting for Kafka broker ($BOOTSTRAP_SERVER) to be ready..."
# NOTE: Relies primarily on depends_on condition: service_healthy. Secondary check below.

echo "Kafka Init Script: Performing secondary check using kafka-topics.sh --list..."
until [ "$retries" -ge "$MAX_RETRIES" ]; do
  # Use --list as a simple connectivity/responsiveness check
  if "$KAFKA_BIN_DIR/kafka-topics.sh" --bootstrap-server "$BOOTSTRAP_SERVER" --list > /dev/null 2>&1; then
    echo "Kafka Init Script: Kafka broker API is responsive."
    break
  fi
  retries=$((retries + 1))
  echo "Kafka Init Script: Broker API not responsive yet. Retrying in $RETRY_INTERVAL seconds... (Attempt $retries/$MAX_RETRIES)"
  sleep "$RETRY_INTERVAL"
done

if [ "$retries" -ge "$MAX_RETRIES" ]; then
  echo "Kafka Init Script: ERROR - Kafka broker API ($BOOTSTRAP_SERVER) did not become responsive after $MAX_RETRIES attempts." >&2
  exit 1 # Exit immediately if broker is not available
fi

# --- Process Topic Configurations ---
echo "Kafka Init Script: Processing topic configurations..."
any_topic_failed=false # Flag to track if any topic fails parsing or creation attempt

# Use tr to translate commas to newlines for reliable iteration
# Use `while read || [[ -n $topic_config ]]` to handle the last line correctly if no trailing newline
echo "$KAFKA_CREATE_TOPICS" | tr ',' '\n' | while IFS= read -r topic_config || [ -n "$topic_config" ]; do
    # Trim leading/trailing whitespace (optional but good practice)
    topic_config=$(echo "$topic_config" | awk '{$1=$1};1')

    if [ -z "$topic_config" ]; then
        continue # Skip empty entries (e.g., caused by adjacent commas ,,)
    fi

    echo "Kafka Init Script: --- Processing configuration: '$topic_config' ---"

    # Save original IFS, set to colon for parsing this config entry
    oIFS="$IFS"
    IFS=':'
    # Use 'set --' to split the string based on new IFS and assign to positional parameters
    set -- $topic_config
    topic_name="$1"
    config_partitions="$2"
    config_replication_factor="$3"
    num_parts=$# # Get the number of parts after splitting
    IFS="$oIFS" # Restore IFS immediately

    # Determine final topic parameters based on parsed parts
    current_topic_name=""
    current_partitions=$DEFAULT_PARTITIONS # Start with default
    current_replication_factor=$DEFAULT_REPLICATION_FACTOR # Start with default
    valid_config=true

    if [ -z "$topic_name" ]; then
         echo "Kafka Init Script: ERROR - Empty topic name parsed from '$topic_config'." >&2
         valid_config=false
    elif [ "$num_parts" -eq 1 ]; then
         # Topic name only, use defaults
         current_topic_name="$topic_name"
         echo "Kafka Init Script: Info - Using defaults for '$current_topic_name' (P: $current_partitions, RF: $current_replication_factor)"
    elif [ "$num_parts" -eq 3 ]; then
         # Topic:Partitions:Replicas specified
         current_topic_name="$topic_name"
         # Validate partitions and replicas are positive integers using grep -E (more portable than bash [[ =~ ]])
         if ! echo "$config_partitions" | grep -Eq '^[1-9][0-9]*$'; then
             echo "Kafka Init Script: ERROR - Invalid partition count '$config_partitions' for topic '$current_topic_name'. Must be a positive integer." >&2
             valid_config=false
         elif ! echo "$config_replication_factor" | grep -Eq '^[1-9][0-9]*$'; then
             echo "Kafka Init Script: ERROR - Invalid replication factor '$config_replication_factor' for topic '$current_topic_name'. Must be a positive integer." >&2
             valid_config=false
         else
             # Use specified values
             current_partitions="$config_partitions"
             current_replication_factor="$config_replication_factor"
             echo "Kafka Init Script: Info - Using specified config for '$current_topic_name' (P: $current_partitions, RF: $current_replication_factor)"
         fi
    else
         # Invalid format (e.g., "topic:1" or "topic:1:2:3")
         echo "Kafka Init Script: ERROR - Invalid configuration format '$topic_config'. Expected 'topic-name' or 'topic-name:partitions:replicas'." >&2
         valid_config=false
    fi

    # If validation failed for this entry, mark failure and skip creation
    if [ "$valid_config" = false ]; then
         any_topic_failed=true
         echo "Kafka Init Script: --- Skipping invalid configuration: '$topic_config' ---"
         continue # Move to the next topic config in the list
    fi

    # --- Create Topic Attempt ---
    echo "Kafka Init Script: Attempting to create topic '$current_topic_name' (Partitions: $current_partitions, Replication: $current_replication_factor)..."
    "$KAFKA_BIN_DIR/kafka-topics.sh" --bootstrap-server "$BOOTSTRAP_SERVER" \
        --create \
        --topic "$current_topic_name" \
        --partitions "$current_partitions" \
        --replication-factor "$current_replication_factor" \
        --if-not-exists

    create_exit_code=$?

    # --- Check Creation Attempt Result ---
    # With --if-not-exists, a non-zero exit code typically indicates a genuine error
    # during the creation attempt (e.g., connectivity issue during the command,
    # invalid topic name rejected by broker, insufficient brokers for replication factor, etc.),
    # *unless* the topic exists AND the requested parameters (partitions/replicas)
    # are different from the existing topic (in which case --alter would be needed).
    # For the purpose of this fast init script, we'll treat any non-zero exit code
    # after the create command as a failure for this topic configuration.
    if [ $create_exit_code -ne 0 ]; then
        echo "Kafka Init Script: ERROR - Creation attempt for '$current_topic_name' failed (exit code $create_exit_code). Please check broker logs for details." >&2
        any_topic_failed=true # Mark that at least one topic failed its creation attempt
    else
        echo "Kafka Init Script: SUCCESS - Creation attempt for '$current_topic_name' finished. (Topic might have already existed)."
        # No verification step here as requested
    fi
    echo "Kafka Init Script: --- Finished processing configuration: '$topic_config' ---"

# End of while loop reading topic configs
done

# --- Final Status Check ---
if [ "$any_topic_failed" = true ]; then
  echo "Kafka Init Script: ERROR - One or more topic configurations were invalid or failed their creation attempt. Please check logs." >&2
  exit 1 # Exit with failure code
else
  echo "Kafka Init Script: SUCCESS - All specified valid topic configurations were processed successfully."
  exit 0 # Exit with success code
fi