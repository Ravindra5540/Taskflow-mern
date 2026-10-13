import express from 'express';
import 'dotenv/config';
import { connectToDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'taskflow-api' });
});
app.use(errorHandler);

async function start() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required. Set it in server/.env.');
    }
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`TaskFlow API listening on port ${port}`);
    });
  } catch (error) {
    console.error(error.message.startsWith('MONGODB_URI is required')
      || error.message.startsWith('JWT_SECRET is required')
      ? error.message
      : 'Could not connect to MongoDB. Check its availability and server configuration.');
    process.exitCode = 1;
  }
}

start();
