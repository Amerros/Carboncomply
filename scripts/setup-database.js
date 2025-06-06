const { initDatabase } = require('../database/connection');

console.log('Setting up database...');
initDatabase();
console.log('Database setup complete!');
