import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { ApplicationModel } from '../models/Application';
import { sendEventReminder } from '../services/emailService';

const router = express.Router();

// Configuration du transporteur d'emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.smtpUser,
    pass: config.email.smtpPass,
  },
});

// Route pour envoyer un email
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { to, subject, text } = req.body;

    const mailOptions = {
      from: config.email.smtpUser,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email envoyé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email', error });
  }
});

export default router; 

// --- Cron Render: rappels d'événements (J-3, J-1, -2h) ---
router.post('/jobs/reminders', async (req: Request, res: Response) => {
  try {
    const cronKey = req.header('X-CRON-KEY');
    if (!cronKey || cronKey !== process.env.CRON_SECRET) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const now = new Date();
    const windowMs = 15 * 60 * 1000; // 15 minutes

    // Candidatures ACCEPTED uniquement, avec event et comedian peuplés
    const applications = await ApplicationModel.find({ status: 'ACCEPTED' })
      .populate('comedian')
      .populate('event');

    let sent = 0;

    for (const app of applications as any[]) {
      const event = app.event;
      const comedian = app.comedian;
      if (!event || !comedian) continue;
      if (!event.date) continue;

      // Construire l'heure de début: date + startTime (fallback 20:00)
      const eventStart = new Date(event.date);
      const [h, m] = (event.startTime ? event.startTime : '20:00').split(':').map((x: string) => parseInt(x, 10));
      eventStart.setHours(h || 0, m || 0, 0, 0);

      const diffMs = eventStart.getTime() - now.getTime();

      // J-3
      const j3 = 72 * 60 * 60 * 1000;
      if (diffMs >= j3 && diffMs < j3 + windowMs && !(app.reminders && app.reminders.j3Sent)) {
        await sendEventReminder(comedian, event, 'J-3');
        app.reminders = { ...(app.reminders || {}), j3Sent: true };
        await app.save();
        sent++;
        continue;
      }

      // J-1
      const j1 = 24 * 60 * 60 * 1000;
      if (diffMs >= j1 && diffMs < j1 + windowMs && !(app.reminders && app.reminders.j1Sent)) {
        await sendEventReminder(comedian, event, 'J-1');
        app.reminders = { ...(app.reminders || {}), j1Sent: true };
        await app.save();
        sent++;
        continue;
      }

      // -2h
      const h2 = 2 * 60 * 60 * 1000;
      if (diffMs >= h2 && diffMs < h2 + windowMs && !(app.reminders && app.reminders.h2Sent)) {
        await sendEventReminder(comedian, event, '-2H');
        app.reminders = { ...(app.reminders || {}), h2Sent: true };
        await app.save();
        sent++;
        continue;
      }
    }

    res.json({ message: 'Rappels traités', sent });
  } catch (error) {
    console.error('Erreur CRON reminders:', error);
    res.status(500).json({ message: 'Erreur lors du traitement des rappels' });
  }
});