import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { createEnquiry, listEnquiries, removeEnquiry } from './db.js';
import { enquirySchema } from './validation.js';

async function syncEnquiryToGoogleSheets(enquiry: ReturnType<typeof createEnquiry>) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...enquiry, secret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ?? '' }), signal: controller.signal });
    clearTimeout(timeout);
  } catch (error) { console.error('Google Sheets sync failed; enquiry remains saved locally.', error); }
}
const app = express();
const port = Number(process.env.PORT ?? 4000);
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) throw new Error('ADMIN_PASSWORD is required.');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));
app.use(morgan('tiny'));
function requireAdmin(request: express.Request, response: express.Response, next: express.NextFunction) { const password = request.header('x-admin-password'); if (!password || password !== adminPassword) { response.status(401).json({ message: 'Invalid admin password.' }); return; } next(); }
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.post('/api/enquiries', (request, response) => { const parsed = enquirySchema.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: 'Please check the form fields.', errors: parsed.error.flatten().fieldErrors }); return; } const enquiry = createEnquiry(parsed.data); void syncEnquiryToGoogleSheets(enquiry); response.status(201).json({ enquiry, message: 'Thank you. We will get in touch shortly.' }); });
app.get('/api/enquiries', requireAdmin, (_request, response) => response.json({ enquiries: listEnquiries() }));
app.delete('/api/enquiries/:id', requireAdmin, (request, response) => { const id = Number(request.params.id); if (!Number.isInteger(id) || id < 1) { response.status(400).json({ message: 'Invalid enquiry ID.' }); return; } if (!removeEnquiry(id)) { response.status(404).json({ message: 'Enquiry not found.' }); return; } response.status(204).send(); });
app.use((_request, response) => response.status(404).json({ message: 'Route not found.' }));
app.listen(port, () => console.log(`Sharma Tuition Point API running on port ${port}`));
