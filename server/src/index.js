const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./db/database');
const { seedData } = require('./db/seeds');

const { router: authRouter } = require('./routes/auth');
const invoicesRouter = require('./routes/invoices');
const purchaseOrdersRouter = require('./routes/purchaseOrders');
const reconciliationRouter = require('./routes/reconciliation');
const reviewsRouter = require('./routes/reviews');
const dashboardRouter = require('./routes/dashboard');
const reportsRouter = require('./routes/reports');
const activityRouter = require('./routes/activity');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static file hosting for uploaded files and sample data
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const sampleDir = path.join(__dirname, '../../sample-data');
if (fs.existsSync(sampleDir)) {
  app.use('/sample-data', express.static(sampleDir));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Smart Recon Enterprise API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend production build if available
const clientDistDir = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
}

// Initialize Database & Routes
async function startServer() {
  try {
    const db = await getDb();
    app.locals.db = db;

    // Seed database if clean
    await seedData(db);

    // Mount API Routes
    app.use('/api/auth', authRouter);
    app.use('/api/invoices', invoicesRouter);
    app.use('/api/purchase-orders', purchaseOrdersRouter);
    app.use('/api/reconciliation', reconciliationRouter);
    app.use('/api/reviews', reviewsRouter);
    app.use('/api/dashboard', dashboardRouter);
    app.use('/api/reports', reportsRouter);
    app.use('/api/activity', activityRouter);
    app.use('/api/settings', settingsRouter);

    // Fallback for SPA routing to serve index.html for non-API routes
    if (fs.existsSync(clientDistDir)) {
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/sample-data')) {
          return next();
        }
        res.sendFile(path.join(clientDistDir, 'index.html'));
      });
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Smart Recon Application running on port ${PORT}`);
      console.log(`  Access URL: http://localhost:${PORT}`);
      console.log(`  API Health: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal: Failed to start backend server:', err);
    process.exit(1);
  }
}

startServer();
