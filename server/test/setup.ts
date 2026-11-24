// Imported first by every test file, before any module opens the database.
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
