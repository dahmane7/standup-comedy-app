import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Fonction pour valider les variables d'environnement requises
function validateRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement requise manquante: ${name}`);
  }
  return value;
}

// Fonction pour obtenir une variable d'environnement avec une valeur par défaut
function getEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config = {
  // Configuration du serveur
  port: parseInt(getEnvVar('PORT', '3001')),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  
  // Base de données
  database: {
    url: validateRequiredEnvVar('DATABASE_URL'),
  },
  
  // JWT (JSON Web Tokens)
  jwt: {
    secret: validateRequiredEnvVar('JWT_SECRET'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '1d'),
  },
  
  // CORS (Cross-Origin Resource Sharing)
  cors: {
    origin: getEnvVar('CORS_ORIGIN', '*'),
  },
  
  // Email (optionnel)
  email: {
    smtpHost: getEnvVar('SMTP_HOST', ''),
    smtpPort: parseInt(getEnvVar('SMTP_PORT', '587')),
    smtpUser: getEnvVar('SMTP_USER', ''),
    smtpPass: getEnvVar('SMTP_PASS', ''),
  },
  
  // Services externes (optionnel)
  google: {
    clientId: getEnvVar('GOOGLE_CLIENT_ID', ''),
    clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET', ''),
  },
  
  // Logs
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
} as const;

export type Config = typeof config;

// Validation de la configuration au démarrage
export function validateConfig(): void {
  try {
    // Vérifier que les variables critiques sont présentes
    if (!config.database.url) {
      throw new Error('DATABASE_URL est requise');
    }
    
    if (!config.jwt.secret) {
      throw new Error('JWT_SECRET est requise');
    }
    
    // Vérifier que le port est valide
    if (config.port < 1 || config.port > 65535) {
      throw new Error(`Port invalide: ${config.port}`);
    }
    
    console.log('✅ Configuration validée avec succès');
  } catch (error) {
    console.error('❌ Erreur de configuration:', error);
    process.exit(1);
  }
} 