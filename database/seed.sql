-- Seed data for development
-- Password for all users: Admin@123

-- Required extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO users (id, email, password, first_name, last_name, phone, role, status)
VALUES
  (
    uuid_generate_v4(),
    'admin@foreverbuildcon.com',
    '$2b$12$PuLVum7ZpKthJK1GQ89fBeQHqrObur8cDgUzLS5gMIVxV7JTtHuyS',
    'Super',
    'Admin',
    '9876543210',
    'admin',
    'active'
  ),
  (
    uuid_generate_v4(),
    'owner@foreverbuildcon.com',
    '$2b$12$PuLVum7ZpKthJK1GQ89fBeQHqrObur8cDgUzLS5gMIVxV7JTtHuyS',
    'Rajesh',
    'Shah',
    '9876543211',
    'owner',
    'active'
  ),
  (
    uuid_generate_v4(),
    'supervisor@foreverbuildcon.com',
    '$2b$12$PuLVum7ZpKthJK1GQ89fBeQHqrObur8cDgUzLS5gMIVxV7JTtHuyS',
    'Suresh',
    'Patel',
    '9876543212',
    'supervisor',
    'active'
  )
ON CONFLICT (email) DO UPDATE
  SET password = EXCLUDED.password,
      status = 'active';
