const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db;

function initDatabase() {
    const dbPath = path.join(__dirname, 'carboncomply.db');
    db = new sqlite3.Database(dbPath);
    
    // Read and execute init.sql
    const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    db.serialize(() => {
        db.exec(initSQL, (err) => {
            if (err) {
                console.error('❌ Database initialization error:', err);
            } else {
                console.log('✅ Database initialized successfully');
            }
        });
    });
    
    return db;
}

function getDb() {
    if (!db) {
        db = initDatabase();
    }
    return db;
}

module.exports = { initDatabase, getDb };
