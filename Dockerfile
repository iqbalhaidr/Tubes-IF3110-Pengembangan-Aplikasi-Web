FROM php:8.3-apache
# add configuration here as needed
RUN apt-get update && apt-get install -y \
        libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && docker-php-ext-enable pdo_pgsql
RUN a2enmod rewrite