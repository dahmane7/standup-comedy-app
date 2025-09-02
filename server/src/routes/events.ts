import express, { Request, Response, NextFunction } from 'express';
import { EventModel } from '../models/Event';
import { UserModel } from '../models/User';
import { ApplicationModel } from '../models/Application';
import { validate } from '../middleware/validation';
import { createEventSchema, updateEventSchema } from '../validation/schemas';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { getEventStats, createEvent, updateEvent } from '../controllers/event';
import { AbsenceModel } from '../models/Absence';

const router = express.Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request | AuthRequest, res: Response) => Promise<any>) => {
  return (req: Request | AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};

// Nouvelle route pour récupérer les statistiques d'événements de l'organisateur (doit être avant /:eventId)
router.get('/stats', authMiddleware, asyncHandler(getEventStats));

// Route pour créer un nouvel événement (protégée) - utilise le contrôleur avec envoi d'emails
router.post('/', authMiddleware, validate(createEventSchema), createEvent);

// Route pour récupérer tous les événements
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const organizerId = req.query.organizerId as string;
  const userRole = req.user?.role; // Get user role from authMiddleware
  const userId = req.user?.id;

  let query: any = {};

  // If an organizerId is provided, filter events by it
  if (organizerId && mongoose.Types.ObjectId.isValid(organizerId)) {
    query.organizer = organizerId;
  } else if (userRole === 'ORGANIZER') {
    // If no specific organizerId, and user is an ORGANIZER, show their own events
    query.organizer = userId;
  } else if (userRole === 'COMEDIAN') {
    // For comedians, show all published events (current and past) 
    // This allows them to see events they applied to, even if past
    query.status = { $in: ['published', 'completed', 'cancelled'] };
  } else if (userRole === 'SUPER_ADMIN') {
    // Super Admin can see ALL events (no filter by status or organizer)
    // This will return all events from all organizers with all statuses
    query = {}; // No filter = return everything
  } else {
    // Fallback for unexpected cases or if no specific filtering applies
    // For now, if no organizerId and not a known role, return nothing or all published events.
    // Given authMiddleware is always present, this else should ideally be covered by above roles.
    query.status = 'published'; // Default to show published for others (e.g. admins if they browse like this)
  }

  const events = await EventModel.find(query).populate('participants').populate('organizer');
  
  // Debug temporaire pour voir quels événements sont retournés
  console.log(`🔍 [DEBUG] Route GET /api/events - Role: ${userRole}, Query:`, JSON.stringify(query, null, 2));
  console.log(`📊 [DEBUG] Événements trouvés: ${events.length}`);
  events.forEach(event => {
    console.log(`📅 [DEBUG] - "${event.title}" (${new Date(event.date).toLocaleDateString('fr-FR')}) - Statut: ${event.status}`);
  });
  
  res.json(events);
}));

// Route pour récupérer un événement par son ID
router.get('/:eventId', asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const event = await EventModel.findById(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Événement non trouvé' });
  }
  res.json(event);
}));

// Route pour mettre à jour un événement (protégée) - utilise le contrôleur avec notification emails
router.put('/:eventId', authMiddleware, validate(updateEventSchema), asyncHandler(updateEvent));

// Route pour supprimer un événement (protégée)
router.delete('/:eventId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { eventId } = req.params;
  const event = await EventModel.findById(eventId);
  
  if (!event) {
    return res.status(404).json({ message: 'Événement non trouvé' });
  }

  // Vérifier si l'utilisateur est l'organisateur de l'événement
  if (event.organizer.toString() !== req.user?.id) {
    return res.status(403).json({ message: 'Non autorisé à supprimer cet événement' });
  }

  // Delete all applications for this event first
  await ApplicationModel.deleteMany({ event: eventId });

  await EventModel.findByIdAndDelete(eventId);

  // Décrémenter le compteur d'événements créés de l'organisateur
  if (req.user?.id) {
    const organizer = await UserModel.findById(req.user.id);
    if (organizer) {
      if (organizer.stats && organizer.stats.totalEvents && organizer.stats.totalEvents > 0) {
        organizer.stats.totalEvents -= 1;
        organizer.markModified('stats');
        await organizer.save();
        console.log('Total events après décrémentation et sauvegarde:', organizer.stats.totalEvents);
      }
    }
  }

  res.json({ message: 'Événement supprimé avec succès' });
}));

// Route pour traiter automatiquement les participations des événements terminés
router.post('/process-completed-events', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    // Vérifier que seul un super admin peut accéder à cette route
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Accès refusé. Seuls les super-admins peuvent traiter les événements.' });
    }

    const now = new Date();
    
    // Trouver tous les événements passés qui ont des participants acceptés
    const pastEvents = await EventModel.find({
      date: { $lt: now },
      status: { $in: ['published', 'completed'] }
    }).populate('participants');

    let totalProcessed = 0;
    let participationsAdded = 0;

    for (const event of pastEvents) {
      // Pour chaque participant de l'événement
      for (const participantId of event.participants) {
        const participant = await UserModel.findById(participantId);
        
        if (participant && participant.role === 'COMEDIAN') {
          // Initialiser les stats si nécessaire
          if (!participant.stats) {
            participant.stats = {};
          }
          if (!participant.stats.processedEvents) {
            participant.stats.processedEvents = [];
          }

          // Vérifier si cet événement a déjà été traité pour ce participant
          const eventIdStr = (event._id as mongoose.Types.ObjectId).toString();
          const alreadyProcessed = participant.stats.processedEvents.includes(eventIdStr);

          if (!alreadyProcessed) {
            // Vérifier si ce humoriste a été marqué absent pour cet événement
            const absence = await AbsenceModel.findOne({
              event: event._id,
              comedian: participantId
            });

            // Si pas d'absence trouvée, incrémenter totalEvents (participation)
            if (!absence) {
              const currentTotalEvents = participant.stats.totalEvents || 0;
              participant.stats.totalEvents = currentTotalEvents + 1;
              participant.stats.processedEvents.push(eventIdStr);
              participant.markModified('stats');
              await participant.save();
              
              participationsAdded++;
              console.log(`✅ Participation ajoutée pour ${participant.firstName} ${participant.lastName} à l'événement "${event.title}"`);
            } else {
              // Marquer comme traité même si absent pour éviter de le retraiter
              participant.stats.processedEvents.push(eventIdStr);
              participant.markModified('stats');
              await participant.save();
              console.log(`⚠️ ${participant.firstName} ${participant.lastName} était absent à l'événement "${event.title}" - pas de participation ajoutée`);
            }
          } else {
            console.log(`ℹ️ Événement "${event.title}" déjà traité pour ${participant.firstName} ${participant.lastName}`);
          }
        }
      }
      totalProcessed++;
    }

    res.json({
      message: 'Traitement des événements terminés effectué avec succès',
      eventsProcessed: totalProcessed,
      participationsAdded: participationsAdded
    });

  } catch (error) {
    console.error('Erreur lors du traitement des événements terminés:', error);
    res.status(500).json({ message: 'Erreur lors du traitement des événements terminés' });
  }
}));

// Route temporaire pour réinitialiser les participations de tous les humoristes (SUPER_ADMIN uniquement)
router.post('/reset-participations', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les super-admins peuvent réinitialiser les participations.' });
  }
  const humorists = await UserModel.find({ role: 'COMEDIAN' });
  let resetCount = 0;
  for (const humorist of humorists) {
    if (!humorist.stats) humorist.stats = {};
    humorist.stats.totalEvents = 0;
    humorist.stats.processedEvents = [];
    humorist.markModified('stats');
    await humorist.save();
    resetCount++;
  }
  res.json({ message: `Participations réinitialisées pour ${resetCount} humoristes.` });
}));

export default router; 