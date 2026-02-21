import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import projectsRouter from './routes/projects.router';
import queryRouter from './routes/query.router';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount routers
app.use('/api/projects', projectsRouter);
app.use('/api/projects', queryRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'project-dna-engine', timestamp: new Date().toISOString() });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`\n  Project DNA Engine`);
  console.log(`  Server: http://localhost:${env.PORT}`);
  console.log(`  Output: ${env.PIPE1_OUT_DIR}`);
  console.log(`  Model:  ${env.OPENAI_MODEL}\n`);
});
