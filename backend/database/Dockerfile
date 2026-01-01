# Use official MariaDB image
FROM mariadb:10.11

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=root123
ENV MYSQL_DATABASE=stixconnect
ENV MYSQL_USER=stixuser
ENV MYSQL_PASSWORD=stix123

# Set working directory
WORKDIR /docker-entrypoint-initdb.d

# Copy schema and init scripts
COPY ./schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY ./init-data.sql /docker-entrypoint-initdb.d/02-init-data.sql

# Copy custom configuration
COPY ./mariadb.cnf /etc/mysql/conf.d/custom.cnf

# Expose MariaDB port
EXPOSE 3306

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD mysqladmin ping -h localhost -u root -p$MYSQL_ROOT_PASSWORD || exit 1

# Add labels for identification
LABEL maintainer="StixConnect Team"
LABEL version="1.0"
LABEL description="MariaDB container for StixConnect telemedicine platform"