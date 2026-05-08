import { dirname, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import Database from 'better-sqlite3';

import { config } from '../config.js';

const dbPath = resolve(process.cwd(), config.dbPath);

mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
