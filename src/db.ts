import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { Enquiry } from './types.js';
import type { EnquiryInput } from './validation.js';

const databasePath = process.env.DATABASE_PATH ?? './data/enquiries.db';
const resolvedPath = path.resolve(databasePath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
const database = new Database(resolvedPath);
database.pragma('journal_mode = WAL');
database.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    class_interested_in TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
const insertEnquiry = database.prepare(`INSERT INTO enquiries (name, phone, class_interested_in, message) VALUES (@name, @phone, @classInterestedIn, @message)`);
const selectEnquiries = database.prepare(`SELECT id, name, phone, class_interested_in AS classInterestedIn, message, created_at AS createdAt FROM enquiries ORDER BY created_at DESC, id DESC`);
const deleteEnquiry = database.prepare('DELETE FROM enquiries WHERE id = ?');
export function createEnquiry(input: EnquiryInput): Enquiry { const result = insertEnquiry.run(input); return getEnquiry(Number(result.lastInsertRowid)) as Enquiry; }
export function listEnquiries(): Enquiry[] { return selectEnquiries.all() as Enquiry[]; }
export function getEnquiry(id: number): Enquiry | undefined { return database.prepare(`SELECT id, name, phone, class_interested_in AS classInterestedIn, message, created_at AS createdAt FROM enquiries WHERE id = ?`).get(id) as Enquiry | undefined; }
export function removeEnquiry(id: number): boolean { return deleteEnquiry.run(id).changes > 0; }
