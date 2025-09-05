import express, { Request, Response, NextFunction } from 'express';
import { ApplicationModel, ApplicationDocument } from '../models/Application';
import { validate } from '../middleware/validation';
import { createApplicationSchema, updateApplicationStatusSchema } from '../validation/schemas';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { IPopulatedApplication, IPopulatedEvent } from '../types';
import { IPopulatedUser } from '../types/user';
import { Types } from 'mongoose';
import { EventModel } from '../models/Event';
import { UserModel } from '../models/User';
import { createApplication } from '../controllers/application';
import { sendApplicationStatusToComedian } from '../services/emailService';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

const router = express.Router();

// Async handler wrapper
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res)).catch(next);
};

// Route pour créer une nouvelle candidature (protégée) - utilise le contrôleur avec envoi d'email
router.post('/', authMiddleware, validate(createApplicationSchema), createApplication);

// Route pour vérifier si une candidature existe déjà (protégée)
router.get('/check/:eventId/:comedianId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { eventId, comedianId } = req.params;
  const existingApplication = await ApplicationModel.findOne({
    event: new Types.ObjectId(eventId),
    comedian: new Types.ObjectId(comedianId),
  });
  res.json({ hasApplied: !!existingApplication });
}));

// Route pour récupérer toutes les candidatures (protégée)
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié.' });
  }

  const { status, eventId } = req.query as { status?: string | string[]; eventId?: string };

  // Construire un filtre DB minimal si eventId est fourni
  const dbFilter: any = {};
  if (eventId && Types.ObjectId.isValid(eventId)) {
    dbFilter.event = new Types.ObjectId(eventId);
  }

  // Récupérer les candidatures (avec filtre éventuel par eventId)
  const applications = await ApplicationModel.find(dbFilter).select('+performanceDetails +message +organizerMessage')
    .populate({
      path: 'event',
      select: 'title date startTime organizer location updatedAt modifiedByOrganizer',
      populate: {
        path: 'organizer',
        select: 'firstName lastName email'
      }
    })
    .populate('comedian');

  // Récupérer les informations de l'utilisateur pour vérifier son rôle
  const { UserModel } = require('../models/User');
  const currentUser = await UserModel.findById(userId);
  const isSuperAdmin = currentUser && currentUser.role === 'SUPER_ADMIN';

  // Filtrage JS : l'utilisateur est soit le comédien, soit l'organisateur de l'événement, soit un super admin
  let filteredApplications = applications.filter(app => {
    // Super admin peut voir toutes les candidatures
    if (isSuperAdmin) {
      return true;
    }
    
    // @ts-ignore
    const isComedian = app.comedian && app.comedian._id.toString() === userId;
    // @ts-ignore
    const isOrganizer = app.event && app.event.organizer && app.event.organizer._id.toString() === userId;
    return isComedian || isOrganizer;
  });

  // Filtrage par statut si demandé
  if (status) {
    const statusArray = Array.isArray(status) ? status : [status];
    filteredApplications = filteredApplications.filter(app => statusArray.includes(app.status));
  }

  res.json(filteredApplications);
}));

// Route pour récupérer une candidature par son ID (protégée)
router.get('/:applicationId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const application = await ApplicationModel.findById(applicationId)
    .populate<{ event: IPopulatedEvent; comedian: IPopulatedUser }>('event')
    .populate('comedian');
    
  if (!application) {
    return res.status(404).json({ message: 'Candidature non trouvée' });
  }

  // Vérifier si l'utilisateur est le candidat ou l'organisateur de l'événement
  const isComedian = (application.comedian as IPopulatedUser)._id.toString() === req.user?.id;
  const isOrganizer = (application.event as IPopulatedEvent).organizer._id.toString() === req.user?.id;

  if (!isComedian && !isOrganizer) {
    return res.status(403).json({ message: 'Non autorisé à voir cette candidature' });
  }

  res.json(application);
}));

// Route pour mettre à jour le statut d'une candidature (protégée)
router.put('/:applicationId/status', authMiddleware, validate(updateApplicationStatusSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const { status, organizerMessage } = req.body;
  
  const application = await ApplicationModel.findById(applicationId).populate<{ event: IPopulatedEvent }>('event');
  if (!application) {
    return res.status(404).json({ message: 'Candidature non trouvée' });
  }

  // Vérifier si l'utilisateur est l'organisateur de l'événement
  const isOrganizer = (application.event as IPopulatedEvent).organizer._id.toString() === req.user?.id;
  if (!isOrganizer) {
    return res.status(403).json({ message: 'Non autorisé à modifier cette candidature' });
  }

  const updateData: any = { status };
  if (organizerMessage !== undefined) {
    updateData.organizerMessage = organizerMessage;
  }

  // 🚨 IMPORTANT: Récupérer l'ancien statut AVANT la mise à jour pour la logique des stats
  const oldStatus = application.status;
  
  const updatedApplication = await ApplicationModel.findByIdAndUpdate(
    applicationId,
    updateData,
    { new: true }
  ).populate<{ event: IPopulatedEvent; comedian: IPopulatedUser }>('event').populate('comedian');

  // Ajout du participant à l'événement si la candidature est acceptée
  if (status === 'ACCEPTED' && updatedApplication && updatedApplication.event && updatedApplication.comedian) {
    // L'identifiant peut être dans _id ou directement l'objet
    const eventId = (updatedApplication.event as any)._id || updatedApplication.event;
    const comedianId = (updatedApplication.comedian as any)._id || updatedApplication.comedian;
    await EventModel.findByIdAndUpdate(
      eventId,
      { $addToSet: { participants: comedianId } } // $addToSet évite les doublons
    );
  }

  // 🎪 AJOUT: Mise à jour des statistiques de l'humoriste (MÊME LOGIQUE que dans application.ts)
  if (updatedApplication && updatedApplication.comedian) {
    const comedianId = (updatedApplication.comedian as any)._id || updatedApplication.comedian;
    const comedian = await UserModel.findById(comedianId);

    if (comedian) {
      if (!comedian.stats) {
        comedian.stats = {};
      }
      
      console.log(`📊 [STATS UPDATE] ${comedian.firstName} ${comedian.lastName}: ${oldStatus} → ${status}`);
      
      // Logique pour applicationsAccepted
      if (status === 'ACCEPTED' && oldStatus !== 'ACCEPTED') {
        comedian.stats.applicationsAccepted = (comedian.stats.applicationsAccepted || 0) + 1;
        
        // 🎪 NOUVEAU: Incrémenter automatiquement les participations (totalEvents) lors de l'acceptation
        comedian.stats.totalEvents = (comedian.stats.totalEvents || 0) + 1;
        console.log(`✅ Participation automatiquement ajoutée pour ${comedian.firstName} ${comedian.lastName} - Total: ${comedian.stats.totalEvents}`);
        
      } else if (status !== 'ACCEPTED' && oldStatus === 'ACCEPTED') {
        comedian.stats.applicationsAccepted = Math.max(0, (comedian.stats.applicationsAccepted || 0) - 1);
        
        // 🎪 NOUVEAU: Décrémenter les participations si on passe d'ACCEPTED à autre chose
        comedian.stats.totalEvents = Math.max(0, (comedian.stats.totalEvents || 0) - 1);
        console.log(`❌ Participation retirée pour ${comedian.firstName} ${comedian.lastName} - Total: ${comedian.stats.totalEvents}`);
      }
      
      // Logique pour applicationsRejected
      if (status === 'REJECTED' && oldStatus !== 'REJECTED') {
        comedian.stats.applicationsRejected = (comedian.stats.applicationsRejected || 0) + 1;
      } else if (status !== 'REJECTED' && oldStatus === 'REJECTED') {
        comedian.stats.applicationsRejected = Math.max(0, (comedian.stats.applicationsRejected || 0) - 1);
      }
      
      // Logique pour applicationsPending
      if (status === 'PENDING' && oldStatus !== 'PENDING') {
        comedian.stats.applicationsPending = (comedian.stats.applicationsPending || 0) + 1;
      } else if (status !== 'PENDING' && oldStatus === 'PENDING') {
        comedian.stats.applicationsPending = Math.max(0, (comedian.stats.applicationsPending || 0) - 1);
      }
      
      comedian.markModified('stats');
      await comedian.save();
      console.log(`💾 Stats sauvegardées pour ${comedian.firstName} ${comedian.lastName}`);
    }
  }

  // Envoi du mail à l'humoriste lors de l'acceptation ou du refus
  if (updatedApplication && updatedApplication.comedian && updatedApplication.event && (status === 'ACCEPTED' || status === 'REJECTED')) {
    // Récupère l'id de l'événement de façon robuste
    const eventId = (typeof updatedApplication.event === 'object' && updatedApplication.event !== null && '_id' in updatedApplication.event)
      ? (updatedApplication.event as any)._id
      : updatedApplication.event;
    const event = await EventModel.findById(eventId).populate('organizer');
    const organizer = event && event.organizer ? event.organizer : null;
    if (event && organizer) {
      sendApplicationStatusToComedian(
        updatedApplication.comedian,
        event,
        organizer,
        status,
        organizerMessage || ''
      ).then(() => {
        console.log(`[EMAIL] Succès de l'envoi à l'humoriste (${updatedApplication.comedian.email}) pour statut ${status}`);
      }).catch(err => {
        console.error(`[EMAIL] Erreur lors de l'envoi à l'humoriste (${updatedApplication.comedian.email}) :`, err);
      });
    }
  }

  res.json(updatedApplication);
}));

// Route pour confirmer la participation - NOUVELLE APPROCHE
router.patch('/:applicationId/confirm', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('🎪 DEBUT confirm participation');
  console.log('🎪 Application ID:', req.params.applicationId);
  console.log('🎪 User ID:', req.user?.id);
  
  const { applicationId } = req.params;
  const comedianId = req.user?.id;

  if (!comedianId) {
    console.log('❌ Non authentifié');
    return res.status(401).json({ message: 'Non authentifié' });
  }

  try {
    // Trouver la candidature
    const application = await ApplicationModel.findById(applicationId);
    console.log('🔍 Application trouvée:', !!application);
    
    if (!application) {
      return res.status(404).json({ message: 'Candidature non trouvée' });
    }

    // Vérifier propriétaire
    if (application.comedian.toString() !== comedianId) {
      console.log('❌ Pas le bon propriétaire');
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Mettre à jour l'événement
    const event = await EventModel.findByIdAndUpdate(
      application.event,
      { modifiedByOrganizer: false },
      { new: true }
    );
    
    console.log('✅ Event modifié:', !!event);
    
    res.json({ 
      success: true, 
      message: 'Participation confirmée' 
    });
    
  } catch (error) {
    console.error('❌ ERREUR:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}));

// Route pour supprimer une candidature (protégée)
router.delete('/:applicationId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const application = await ApplicationModel.findById(applicationId).populate<{ event: IPopulatedEvent; comedian: IPopulatedUser }>('event').populate('comedian');
  
  if (!application) {
    return res.status(404).json({ message: 'Candidature non trouvée' });
  }

  // Vérifier si l'utilisateur est le candidat ou l'organisateur de l'événement
  const isComedian = (application.comedian as IPopulatedUser)._id.toString() === req.user?.id;
  const isOrganizer = (application.event as IPopulatedEvent).organizer._id.toString() === req.user?.id;

  if (!isComedian && !isOrganizer) {
    return res.status(403).json({ message: 'Non autorisé à supprimer cette candidature' });
  }

  // Si la candidature était ACCEPTED, retirer le comédien des participants de l'événement
  // ET ajouter le comédien aux withdrawnComedians pour empêcher une nouvelle candidature
  try {
    if (application.event && application.comedian) {
      const eventId = (application.event as any)._id || application.event;
      const comedianId = (application.comedian as any)._id || application.comedian;
      
      // Si accepté, retirer des participants
      if (application.status === 'ACCEPTED') {
        await EventModel.findByIdAndUpdate(eventId, { $pull: { participants: comedianId } });
      }
      
      // Dans tous les cas, ajouter aux withdrawnComedians pour empêcher re-candidature
      await EventModel.findByIdAndUpdate(eventId, { 
        $addToSet: { withdrawnComedians: comedianId } 
      });
    }
  } catch (e) {
    console.error('Erreur lors du retrait du participant de l\'événement:', e);
  }

  await ApplicationModel.findByIdAndDelete(applicationId);
  res.json({ message: 'Candidature supprimée avec succès' });
}));

export default router; 

// Réponse d'un humoriste après mise à jour d'événement (via lien email)
router.get('/respond-update', asyncHandler(async (req: Request, res: Response) => {
  const { token, action } = req.query as { token?: string; action?: 'keep' | 'withdraw' };
  if (!token || !action) return res.status(400).send('Requête invalide');

  try {
    const payload = jwt.verify(token, config.jwt.secret as string) as any;
    const applicationId = payload.applicationId as string;
    if (!applicationId) return res.status(400).send('Token invalide');

    if (action === 'withdraw') {
      await ApplicationModel.findByIdAndDelete(applicationId);
      return res.redirect('https://standup-comedy-app.netlify.app/applications?update=withdrawn');
    }

    // keep: on ne change rien, simple confirmation
    return res.redirect('https://standup-comedy-app.netlify.app/applications?update=kept');
  } catch (_e) {
    return res.status(400).send('Lien expiré ou invalide');
  }
}));