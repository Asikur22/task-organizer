FROM nginx:alpine

# Copy static assets to default Nginx public folder
# This is a fallback/initial copy; the volume mount in docker-compose will override this for dev.
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80
