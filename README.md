This is the README file for the project.
Follow the instructions on the specifications provided.

## Database Initialization (Temporary Guide)

The database is created and initialized automatically when you start the application using Docker Compose.

### Prerequisites
- Docker and Docker Compose must be installed on your system.

### Steps
1.  Open a terminal in the root directory of the project.
2.  Run the following command:
    ```bash
    docker-compose up -d --build
    ```
3.  That's it! The command will:
    *   Build the required Docker images.
    *   Start the PHP/Apache and PostgreSQL services in the background.
    *   Create the `nimonspedia_db` database.
    *   Automatically run the `db/migrations/init.sql` script to create all the necessary tables and seed initial data.

To stop the services, you can run `docker-compose down`.
