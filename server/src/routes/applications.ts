import express, { Request, Response, NextFunction } from 'express';
import { ApplicationModel, ApplicationDocument } from '../models/Application';
import { validate } from '../middleware/validation';
import { createApplicationSchema, updateApplicationStatusSchema } from '../validation/schemas';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { IPopulatedApplication, IPopulatedEvent } from '../types';
import { IPopulatedUser } from '../types/user';
import { Types } from 'mongoose';
import { EventModel } from '../models/Event';
import { createApplication } from '../controllers/application';
import { sendApplicationStatusToComedian } from '../services/emailService';

const router = express.Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request | AuthRequest, res: Response) => Promise<any>) => {
  return (req: Request | AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
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

  const { status } = req.query;

  // On récupère toutes les candidatures et on filtre côté JS
  const applications = await ApplicationModel.find().select('+performanceDetails +message +organizerMessage')
    .populate({
      path: 'event',
      select: 'title date startTime organizer location',
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

  await ApplicationModel.findByIdAndDelete(applicationId);
  res.json({ message: 'Candidature supprimée avec succès' });
}));

export default router; 