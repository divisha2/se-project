import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import fileRoutes from './routes/files.js';
import userRoutes from './routes/users.js';
import submissionRoutes from './routes/submissions.js';
import courseFileRoutes from './routes/courseFile.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/course-file', courseFileRoutes);

// PostgreSQL connection and sync
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ PostgreSQL connected');
    
    // Sync database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✓ Database synced');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error.message);
    console.log('\nMake sure PostgreSQL is running and credentials are correct in .env file:');
    console.log(`DB_HOST=${process.env.DB_HOST}`);
    console.log(`DB_PORT=${process.env.DB_PORT}`);
    console.log(`DB_NAME=${process.env.DB_NAME}`);
    console.log(`DB_USER=${process.env.DB_USER}`);
    process.exit(1);
  }
};

startServer();
