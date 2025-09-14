const db = require('./database');

const initDatabase = async () => {
  try {
    // Read the schema file
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await db.query(schema);
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Run the initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;