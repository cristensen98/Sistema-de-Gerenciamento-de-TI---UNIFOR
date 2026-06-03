const Database = require('better-sqlite3');
const db = new Database('sisti.db');

const tableInfo = db.prepare('PRAGMA table_info(equipments)').all();
console.log(tableInfo);
