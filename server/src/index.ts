import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config/env';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import eventsRoutes from './routes/events';
import applicationsRoutes from './routes/applications';
import profileRoutes from './routes/profile';
import emailRoutes from './routes/email';
import absencesRoutes from './routes/absences';

const app = express();

// Middleware CORS configuré pour autoriser le frontend Netlify
app.use(cors({
  origin: true, // Autorise toutes les origines pour éviter les problèmes avec les URLs Netlify changeantes
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/absences', absencesRoutes);

// Gestion des erreurs
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur du serveur:', err.message);
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // Valider la configuration avant de démarrer
    validateConfig();
    
    await connectDatabase();
    
    app.listen(config.port, () => {
      console.log(`🚀 Serveur démarré sur le port ${config.port} en mode ${config.nodeEnv}`);
      console.log(`📊 Niveau de log: ${config.logLevel}`);
      console.log(`🌐 CORS origin: ${config.cors.origin}`);
    });
  } catch (error) {
    console.error('❌ Échec du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer(); 