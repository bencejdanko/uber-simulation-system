# Use a specific version tag in production instead of latest
FROM kong/kong-gateway:latest

# Use root user for file system operations like copy and permissions
USER root

# Define an argument for the plugin name for potential reuse (optional)
ARG PLUGIN_NAME=jwt

# Copy the plugin source code from the build context (kong_custom/plugins/...)
# into the standard Kong Lua path location inside the image.
# Kong's default LUA_PACKAGE_PATH usually includes /usr/local/share/lua/5.1/kong/plugins/?.lua
COPY ./plugins/${PLUGIN_NAME} /usr/local/share/lua/5.1/kong/plugins/${PLUGIN_NAME}

# Set the KONG_PLUGINS environment variable *during the build*.
# This tells Kong which plugins to load on startup.
# Include 'bundled' to keep the standard plugins, and add your custom one.
ENV KONG_PLUGINS=bundled,${PLUGIN_NAME}
#${PLUGIN_NAME}
# Optionally, ensure the kong user owns the copied files
# RUN chown -R kong:kong /usr/local/share/lua/5.1/kong/plugins/${PLUGIN_NAME}

# Switch back to the non-privileged kong user for runtime execution
USER kong

# Expose standard Kong ports (often inherited, but good to be explicit)
EXPOSE 8000 8443 8001 8444

# Standard Kong healthcheck and entrypoint/cmd (often inherited)
STOPSIGNAL SIGQUIT
HEALTHCHECK --interval=10s --timeout=10s --retries=10 CMD kong health
# ENTRYPOINT ["docker-entrypoint.sh"] # Usually inherited
CMD ["kong", "docker-start"]