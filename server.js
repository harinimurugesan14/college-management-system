require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./src/middleware');

const app = express();
const dirs = helmet.contentSecurityPolicy.getDefaultDirectives();
delete dirs['upgrade-insecure-requests'];
app.use(helmet({ contentSecurityPolicy: { useDefaults: false, directives: dirs } }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', require('./src/routes'));
app.use('/api', (_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(errorHandler);

async function dbUri() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const dir = path.join(__dirname, 'data');
  fs.mkdirSync(dir, { recursive: true });
  const m = await MongoMemoryServer.create({ instance: { dbPath: dir, storageEngine: 'wiredTiger' } });
  console.log('Using built-in local MongoDB (data stored in ./data)');
  return m.getUri('smart_campus');
}
async function start() {
  if (!process.env.JWT_SECRET) throw new Error('Missing JWT_SECRET in .env');
  await mongoose.connect(await dbUri());
  if (process.env.AUTO_SEED !== 'false') await require('./seed').run();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Smart Campus running at http://localhost:${port}`));
}
module.exports = app;
if (require.main === module) start().catch(e => { console.error('Startup failed:', e.message); process.exit(1); });
