-- SQL commands to fix PostgreSQL permissions for the iotflow user
-- Run these commands as the postgres superuser

-- Connect to the iotflow database
\c iotflow;

-- Grant all privileges on the public schema to the iotflow user
GRANT ALL PRIVILEGES ON SCHEMA public TO iotflow;
GRANT CREATE ON SCHEMA public TO iotflow;

-- Grant privileges on all existing tables and sequences
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO iotflow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO iotflow;

-- Set default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO iotflow;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO iotflow;

-- Make iotflow the owner of the database (optional, for full control)
ALTER DATABASE iotflow OWNER TO iotflow;

-- Verify the permissions
\du iotflow;
