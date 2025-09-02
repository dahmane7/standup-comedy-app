import { z } from 'zod';

// Schéma de validation pour l'authentification
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().min(6, 'Phone must be at least 6 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['COMEDIAN', 'ORGANIZER', 'ADMIN'])
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Schéma de validation pour les événements
export const locationSchema = z.object({
  venue: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required')
});

// Nouveau schéma pour la mise à jour partielle de la localisation
export const updateLocationSchema = z.object({
  city: z.string().min(1, 'City is required').optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).partial();

export const requirementsSchema = z.object({
  minExperience: z.number().min(0, 'Minimum experience must be 0 or greater'),
  maxPerformers: z.number().min(1, 'Maximum performers must be at least 1').optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute')
});

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().refine((str) => {
    const date = new Date(str);
    return !isNaN(date.getTime());
  }, 'Invalid date format').transform(str => new Date(str)),
  location: locationSchema,
  requirements: requirementsSchema
});

// Pour la mise à jour, autoriser des objets partiels en profondeur (ex: location seulement avec city)
export const updateEventSchema = createEventSchema.partial({ deep: true });

// Schéma de validation pour les candidatures
export const performanceDetailsSchema = z.object({
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  videoLink: z.string().url('Invalid video URL').optional()
});

export const createApplicationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  performanceDetails: performanceDetailsSchema.optional(),
  message: z.string().optional()
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
  organizerMessage: z.string().optional()
});

// Schéma de validation pour la mise à jour du profil (mis à jour)
export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  profile: z.object({
    bio: z.string().optional(),
    experience: z.number().min(0).optional(),
    speciality: z.string().optional(),
  }).optional(),
  organizerProfile: z.object({
    companyName: z.string().optional(),
    description: z.string().optional(),
    website: z.string().url('Invalid website URL').optional(),
    venueTypes: z.array(z.string()).optional(),
    eventFrequency: z.enum(['weekly', 'monthly', 'occasional']).optional(),
    location: updateLocationSchema.optional(), // Intégrer le schéma de localisation ici
    phone: z.string().optional(),
  }).optional(),
}).partial(); 