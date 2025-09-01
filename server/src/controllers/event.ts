import { Request, Response } from 'express';
import { EventModel } from '../models/Event';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import { ApplicationModel } from '../models/Application';
import { sendNewEventNotificationToHumorists } from '../services/emailService';

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🔍 [DEBUG] createEvent - Données reçues:', req.body);
    const { title, description, date, location, requirements, startTime, endTime } = req.body;
    const organizerId = req.user?.id;
    
    console.log('📅 Date reçue:', date, 'Type:', typeof date);
    console.log('📅 Date parsée:', new Date(date));

    const event = new EventModel({
      title,
      description,
      date,
      location,
      requirements,
      organizer: organizerId,
      status: 'published', // Événement directement publié et visible aux humoristes
      applications: [],
      startTime,
      endTime
    });

    await event.save();

    // Récupérer les informations de l'organisateur pour l'email et mise à jour stats
    console.log('🔍 Récupération des infos organisateur pour email...');
    const organizer = await UserModel.findById(organizerId);
    console.log('👤 Organisateur trouvé:', organizer ? `${organizer.firstName} ${organizer.lastName} (${organizer.email})` : 'AUCUN');
    
    // Update organizer's totalEvents count et envoi d'emails
    if (organizer) {
      console.log('Organisateur trouvé dans events.ts:', organizer.email);
      console.log('Total events avant incrémentation:', organizer.stats?.totalEvents);
      if (!organizer.stats) {
        organizer.stats = {};
      }
      organizer.stats.totalEvents = (organizer.stats.totalEvents || 0) + 1;
      organizer.markModified('stats');
      await organizer.save();
      console.log('Total events après incrémentation et sauvegarde:', organizer.stats.totalEvents);
      console.log('📧 Démarrage envoi notifications email...');
      // Envoyer les notifications par email aux humoristes
      // Ne pas attendre la fin de l'envoi pour répondre à l'utilisateur
      sendNewEventNotificationToHumorists({
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        requirements: event.requirements,
        startTime: req.body.startTime // Si l'heure est fournie
      }, {
        firstName: organizer.firstName,
        lastName: organizer.lastName,
        email: organizer.email
      }).catch(emailError => {
        console.error('❌ Erreur lors de l\'envoi des notifications:', emailError);
      });
    } else {
      console.log('❌ Impossible d\'envoyer les emails : organisateur non trouvé');
    }

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
};

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, date, city } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (date) query.date = { $gte: new Date(date as string) };
    if (city) query['location.city'] = city;

    const events = await EventModel.find(query)
      .populate('organizer', 'firstName lastName email')
      .sort({ date: 1 });

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await EventModel.findById(req.params.eventId)
      .populate('organizer', 'firstName lastName email')
      .populate({
        path: 'applications',
        populate: {
          path: 'comedian',
          select: 'firstName lastName email profile'
        }
      });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Error fetching event' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.eventId;
    const organizerId = req.user?.id;

    const event = await EventModel.findOne({ _id: eventId, organizer: organizerId });
    if (!event) {
      res.status(404).json({ message: 'Event not found or unauthorized' });
      return;
    }

    const updatedEvent = await EventModel.findByIdAndUpdate(
      eventId,
      { $set: req.body },
      { new: true }
    );

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const eventId = req.params.eventId;
    const organizerId = req.user?.id;

    const event = await EventModel.findOne({ _id: eventId, organizer: organizerId });
    if (!event) {
      res.status(404).json({ message: 'Event not found or unauthorized' });
      return;
    }

    await EventModel.findByIdAndDelete(eventId);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
};

export const getOrganizerEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizerId = req.user?.id;

    const events = await EventModel.find({ organizer: organizerId })
      .sort({ date: 1 });

    res.json({ events });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ message: 'Error fetching organizer events' });
  }
};

// GET /api/events/stats - Nombre d'événements créés par l'organisateur
export const getEventStats = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user?.id; // Utiliser req.user?.id pour le middleware d'authentification
    const userRole = req.user?.role;
    
    console.log('🔍 [DEBUG] getEventStats appelé:');
    console.log('   • User ID:', organizerId);
    console.log('   • User Role:', userRole);
    console.log('   • req.user:', req.user);
    
    if (!organizerId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const now = new Date();

    // Si c'est un super admin, récupérer les statistiques globales de toute la plateforme
    if (userRole === 'SUPER_ADMIN') {
      console.log('🔥 Super Admin - Récupération des statistiques globales');
      
      // Récupérer TOUS les événements de la plateforme
      console.log('🔍 Requête MongoDB: EventModel.find({})');
      const allEvents = await EventModel.find({});
      console.log('📊 Événements trouvés dans la DB:', allEvents.length);
      
      // Log des premiers événements pour debug
      if (allEvents.length > 0) {
        console.log('📅 Détail des événements trouvés:');
        allEvents.forEach((event, index) => {
          console.log(`   ${index + 1}. "${event.title}" - ${event.date} - Status: "${event.status}" - Organisateur: ${event.organizer}`);
        });
      } else {
        console.log('❌ AUCUN événement trouvé dans la base !');
        // Test direct de connexion MongoDB
        console.log('🔍 Test de connexion MongoDB...');
        try {
          if (mongoose.connection.db) {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('📚 Collections disponibles:', collections.map(c => c.name));
            
            // Test direct sur la collection events
            const rawEvents = await mongoose.connection.db.collection('events').find({}).toArray();
            console.log('📊 Événements via collection directe:', rawEvents.length);
            if (rawEvents.length > 0) {
              rawEvents.slice(0, 2).forEach((event, index) => {
                console.log(`   RAW ${index + 1}. "${event.title}" - Status: "${event.status}"`);
              });
            }
          } else {
            console.log('❌ mongoose.connection.db est undefined');
          }
        } catch (dbError) {
          console.error('❌ Erreur test DB:', dbError);
        }
      }
      
      const eventIds = allEvents.map(event => event._id);

      // Récupérer TOUTES les candidatures de la plateforme
      const allApplications = await ApplicationModel.find({ event: { $in: eventIds } });
      console.log('📊 Candidatures trouvées dans la DB:', allApplications.length);

      const totalEvents = allEvents.length;
      const pendingApplications = allApplications.filter(app => app.status === 'PENDING').length;
      const acceptedApplications = allApplications.filter(app => app.status === 'ACCEPTED').length;
      const rejectedApplications = allApplications.filter(app => app.status === 'REJECTED').length;

      const upcomingIncompleteEvents = allEvents.filter(event =>
        new Date(event.date) >= now && (event.status === 'draft' || event.status === 'published')
      ).length;

      const completedEvents = allEvents.filter(event =>
        new Date(event.date) < now || event.status === 'completed'
      ).length;

      console.log('📊 Statistiques globales calculées:', {
        totalEvents,
        pendingApplications,
        acceptedApplications,
        rejectedApplications,
        upcomingIncompleteEvents,
        completedEvents
      });

      return res.status(200).json({ 
        totalEvents, 
        upcomingIncompleteEvents, 
        completedEvents, 
        pendingApplications, 
        acceptedApplications, 
        rejectedApplications 
      });
    }

    console.log('👤 Utilisateur normal (non super admin) - Role:', userRole);

    // Logique existante pour les organisateurs normaux
    const objectOrganizerId = new mongoose.Types.ObjectId(organizerId);

    // Récupérer tous les événements de l'organisateur
    const allEvents = await EventModel.find({ organizer: objectOrganizerId });
    const eventIds = allEvents.map(event => event._id);

    // Récupérer toutes les candidatures liées à ces événements
    const allApplications = await ApplicationModel.find({ event: { $in: eventIds } });

    const totalEvents = allEvents.length;
    const pendingApplications = allApplications.filter(app => app.status === 'PENDING').length;
    const acceptedApplications = allApplications.filter(app => app.status === 'ACCEPTED').length;
    const rejectedApplications = allApplications.filter(app => app.status === 'REJECTED').length;

    const upcomingIncompleteEvents = allEvents.filter(event =>
      new Date(event.date) >= now && (event.status === 'draft' || event.status === 'published')
    ).length;

    const completedEvents = allEvents.filter(event =>
      new Date(event.date) < now || event.status === 'completed'
    ).length;

    res.status(200).json({ totalEvents, upcomingIncompleteEvents, completedEvents, pendingApplications, acceptedApplications, rejectedApplications });
  } catch (err) {
    console.error('Error fetching event stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 