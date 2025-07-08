FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html/

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Make sure entrypoint script is executable
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Set default environment variables
ENV API_HOST=localhost
ENV API_PORT=3000

EXPOSE 80

# Use custom entrypoint to inject environment variables
ENTRYPOINT ["/docker-entrypoint.sh"]
