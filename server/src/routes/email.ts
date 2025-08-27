import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { config } from '../config/env';

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