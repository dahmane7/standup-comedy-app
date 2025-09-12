import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { config } from '../config/env';

// Configuration du transporteur d'emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.smtpUser,
    pass: config.email.smtpPass,
  },
});

export const sendApplicationNotificationToOrganizer = async (eventData: any, humoristData: any, organizerData: any, applicationData: any) => {
  try {
    console.log('📬 Service Email: Notification candidature à l\'organisateur...');
    console.log('📧 Variables EMAIL disponibles:', {
      SMTP_USER: config.email.smtpUser ? 'Configuré' : 'MANQUANT',
      SMTP_PASS: config.email.smtpPass ? 'Configuré' : 'MANQUANT'
    });

    // Préparer le contenu de l'email pour l'organisateur
    const subject = `🎭 Nouvelle candidature de ${humoristData.firstName} ${humoristData.lastName} pour "${eventData.title}"`;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle candidature reçue</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header .subtitle {
            margin-top: 10px;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .humorist-card {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
        }
        .humorist-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        .humorist-avatar {
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
            margin-right: 20px;
            border: 3px solid rgba(255,255,255,0.3);
        }
        .humorist-info h2 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .humorist-info p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .event-summary {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .event-title {
            font-size: 20px;
            color: #333;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .event-details {
            display: grid;
            gap: 8px;
            color: #666;
            font-size: 14px;
        }
        .detail-item {
            display: flex;
            align-items: center;
        }
        .detail-icon {
            margin-right: 8px;
            width: 20px;
        }
        .performance-details {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .performance-details h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
            font-size: 16px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-item {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 12px;
            opacity: 0.9;
        }
        .cta-buttons {
            display: flex;
            gap: 15px;
            margin: 30px 0;
            justify-content: center;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 25px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            min-width: 120px;
        }
        .btn-accept {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
        }
        .btn-review {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .contact-info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
        }
        .contact-info a {
            color: #0c5460;
            text-decoration: none;
            font-weight: bold;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            .header, .content {
                padding: 20px;
            }
            .humorist-card {
                padding: 20px;
            }
            .cta-buttons {
                flex-direction: column;
                align-items: center;
            }
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Nouvelle Candidature Reçue !</h1>
            <div class="subtitle">Un humoriste souhaite participer à votre événement</div>
        </div>
        
        <div class="content">
            <p>Bonjour <strong>${organizerData.firstName}</strong>,</p>
            <p>Excellente nouvelle ! Un humoriste vient de postuler pour votre événement.</p>
            
            <div class="humorist-card">
                <div class="humorist-header">
                    <div class="humorist-avatar">
                        ${humoristData.firstName.charAt(0)}${humoristData.lastName.charAt(0)}
                    </div>
                    <div class="humorist-info">
                        <h2>${humoristData.firstName} ${humoristData.lastName}</h2>
                        <p>🎤 Humoriste stand-up</p>
                    </div>
                </div>
                
                <div class="contact-info">
                    📧 Contact : <a href="mailto:${humoristData.email}">${humoristData.email}</a>
                    ${humoristData.phone ? `<br>📞 Téléphone : ${humoristData.phone}` : ''}
                </div>
            </div>
            
            <div class="event-summary">
                <div class="event-title">📅 ${eventData.title}</div>
                <div class="event-details">
                    <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span>${eventData.location.address}, ${eventData.location.city}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📆</span>
                        <span>${new Date(eventData.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    ${eventData.startTime ? `
                    <div class="detail-item">
                        <span class="detail-icon">⏰</span>
                        <span>${eventData.startTime}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${applicationData.performanceDetails ? `
            <div class="performance-details">
                <h3>🎭 Détails de la performance proposée</h3>
                ${applicationData.performanceDetails.duration ? `<p><strong>Durée :</strong> ${applicationData.performanceDetails.duration} minutes</p>` : ''}
                ${applicationData.performanceDetails.description ? `<p><strong>Description :</strong> ${applicationData.performanceDetails.description}</p>` : ''}
                ${applicationData.performanceDetails.videoLink ? `<p><strong>Vidéo :</strong> <a href="${applicationData.performanceDetails.videoLink}" target="_blank" style="color: #1976d2;">Voir la vidéo</a></p>` : ''}
            </div>
            ` : ''}
            
            ${applicationData.message ? `
            <div class="performance-details" style="background: #f0f8ff; border-left-color: #4682b4;">
                <h3>💬 Message de l'humoriste</h3>
                <p>${applicationData.message}</p>
            </div>
            ` : ''}
            
            ${humoristData.profile ? `
            <div class="stats-grid">
                ${humoristData.profile.experienceLevel ? `
                <div class="stat-item">
                    <div class="stat-value">${humoristData.profile.experienceLevel}</div>
                    <div class="stat-label">Niveau</div>
                </div>
                ` : ''}
                ${humoristData.stats && humoristData.stats.totalEvents ? `
                <div class="stat-item">
                    <div class="stat-value">${humoristData.stats.totalEvents}</div>
                    <div class="stat-label">Événements</div>
                </div>
                ` : ''}
                ${humoristData.profile.genres && humoristData.profile.genres.length > 0 ? `
                <div class="stat-item">
                    <div class="stat-value">${humoristData.profile.genres.length}</div>
                    <div class="stat-label">Genres</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="cta-buttons">
                <a href="https://standup-comedy-app.netlify.app/applications" class="cta-button btn-review">
                    📋 Voir les Candidatures
                </a>
            </div>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
                Connectez-vous à votre tableau de bord pour examiner cette candidature en détail.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>L'équipe Standup Comedy Connect</strong></p>
            <p>Connecter les talents avec les opportunités</p>
        </div>
    </div>
</body>
</html>
    `;

    const mailOptions = {
              from: `"${humoristData.firstName} ${humoristData.lastName}" <${config.email.smtpUser}>`,
      replyTo: humoristData.email, // Les réponses iront directement à l'humoriste
      to: organizerData.email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Notification envoyée à l'organisateur ${organizerData.firstName} ${organizerData.lastName} (${organizerData.email}) pour la candidature de ${humoristData.firstName} ${humoristData.lastName}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification à l\'organisateur:', error);
    console.error('🔍 Détail de l\'erreur:', error instanceof Error ? error.stack : 'Erreur inconnue');
    // Ne pas faire échouer la création de la candidature si l'email échoue
  }
};

export const sendNewEventNotificationToHumorists = async (eventData: any, organizerData: any) => {
  try {
    console.log('📬 Service Email: Début de la fonction d\'envoi...');
    console.log('📧 Variables EMAIL disponibles:', {
      SMTP_USER: config.email.smtpUser ? 'Configuré' : 'MANQUANT',
      SMTP_PASS: config.email.smtpPass ? 'Configuré' : 'MANQUANT'
    });
    
    // Récupérer tous les humoristes de la plateforme
    const humorists = await UserModel.find({ role: 'COMEDIAN' }).select('email firstName lastName');
    console.log(`🎭 ${humorists.length} humoristes trouvés dans la base`);
    
    if (humorists.length === 0) {
      console.log('❌ Aucun humoriste trouvé pour l\'envoi de notifications');
      return;
    }

    // Préparer le contenu de l'email personnalisé avec l'organisateur
    const subject = `🎤 Nouvel événement de ${organizerData.firstName} ${organizerData.lastName} : ${eventData.title}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvel événement disponible</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header .subtitle {
            margin-top: 10px;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .event-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        .event-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
        }
        .event-details {
            display: grid;
            gap: 10px;
        }
        .detail-item {
            display: flex;
            align-items: center;
            background: rgba(255,255,255,0.1);
            padding: 10px 15px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .detail-icon {
            font-size: 18px;
            margin-right: 10px;
            width: 25px;
        }
        .organizer-card {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .organizer-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .organizer-avatar {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
            margin-right: 15px;
        }
        .organizer-info h3 {
            margin: 0;
            color: #333;
            font-size: 18px;
        }
        .organizer-info p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        .requirements {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .requirements h3 {
            margin: 0 0 15px 0;
            color: #856404;
            font-size: 16px;
        }
        .requirement-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .requirement-list li {
            padding: 5px 0;
            color: #856404;
            font-size: 14px;
        }
        .requirement-list li:before {
            content: "✓ ";
            color: #28a745;
            font-weight: bold;
            margin-right: 8px;
        }
        .description {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .cta-button {
            display: block;
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin: 30px auto 20px auto;
            max-width: 250px;
            box-shadow: 0 5px 15px rgba(255, 65, 108, 0.4);
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .contact-info {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
        }
        .contact-info a {
            color: #155724;
            text-decoration: none;
            font-weight: bold;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 15px;
            }
            .header, .content {
                padding: 20px;
            }
            .event-card {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎤 Nouvel Événement Disponible !</h1>
            <div class="subtitle">Une nouvelle opportunité vous attend</div>
        </div>
        
        <div class="content">
            <p>Bonjour,</p>
            <p>Une nouvelle opportunité vient d'être publiée sur <strong>Standup Comedy Connect</strong> !</p>
            
            <div class="organizer-card">
                <div class="organizer-header">
                    <div class="organizer-avatar">
                        ${organizerData.firstName.charAt(0)}${organizerData.lastName.charAt(0)}
                    </div>
                    <div class="organizer-info">
                        <h3>👤 ${organizerData.firstName} ${organizerData.lastName}</h3>
                        <p>Organisateur de l'événement</p>
                    </div>
                </div>
                <div class="contact-info">
                    💬 Contact direct : <a href="mailto:${organizerData.email}">${organizerData.email}</a>
                </div>
            </div>
            
            <div class="event-card">
                <div class="event-title">${eventData.title}</div>
                <div class="event-details">
                    <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span>${eventData.location.address}, ${eventData.location.city}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📆</span>
                        <span>${new Date(eventData.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    ${eventData.startTime ? `
                    <div class="detail-item">
                        <span class="detail-icon">⏰</span>
                        <span>${eventData.startTime}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            ${eventData.description ? `
            <div class="description">
                <strong>📝 Description :</strong><br>
                ${eventData.description}
            </div>
            ` : ''}
            
            ${eventData.requirements ? `
            <div class="requirements">
                <h3>📋 Exigences de l'événement</h3>
                <ul class="requirement-list">
                    <li>Durée de performance : <strong>${eventData.requirements.duration} minutes</strong></li>
                    <li>Nombre maximum de performeurs : <strong>${eventData.requirements.maxPerformers}</strong></li>
                    <li>Expérience minimale : <strong>${eventData.requirements.minExperience} ans</strong></li>
                </ul>
            </div>
            ` : ''}
            
            <a href="https://standup-comedy-app.netlify.app/events" class="cta-button">
                🚀 Postuler Maintenant
            </a>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
                Ne ratez pas cette opportunité ! Connectez-vous à votre compte pour postuler dès maintenant.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>L'équipe Standup Comedy Connect</strong></p>
            <p>Votre plateforme pour connecter humoristes et organisateurs</p>
        </div>
    </div>
</body>
</html>
    `;

    // Envoyer l'email à tous les humoristes avec l'organisateur en reply-to
    const emailPromises = humorists.map(humorist => {
      const mailOptions = {
        from: `"${organizerData.firstName} ${organizerData.lastName}" <${config.email.smtpUser}>`,
        replyTo: organizerData.email, // Les réponses iront directement à l'organisateur
        to: humorist.email,
        subject: subject,
        html: htmlContent, // Utilise HTML au lieu de text
      };

      return transporter.sendMail(mailOptions);
    });

    console.log('🚀 Envoi en cours des emails...');
    await Promise.all(emailPromises);
    
    console.log(`✅ Notifications envoyées à ${humorists.length} humoristes pour l'événement "${eventData.title}" par ${organizerData.firstName} ${organizerData.lastName}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des notifications d\'événement:', error);
    console.error('🔍 Détail de l\'erreur:', error instanceof Error ? error.stack : 'Erreur inconnue');
    // Ne pas faire échouer la création de l'événement si l'email échoue
  }
};

export const sendApplicationStatusToComedian = async (
  comedian: any,
  event: any,
  organizer: any,
  status: 'ACCEPTED' | 'REJECTED',
  organizerMessage: string
) => {
  const subject = status === 'ACCEPTED'
    ? `🎉 Votre candidature a été ACCEPTÉE pour l'événement "${event.title}" !`
    : `😔 Votre candidature a été REFUSÉE pour l'événement "${event.title}"`;

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); padding: 32px;">
      <h2 style="color: ${status === 'ACCEPTED' ? '#28a745' : '#dc3545'}; text-align: center;">
        ${status === 'ACCEPTED' ? '🎉 Félicitations !' : '😔 Candidature refusée'}
      </h2>
      <p style="font-size: 1.1em; text-align: center;">
        ${status === 'ACCEPTED'
          ? `Votre candidature pour l'événement <b>${event.title}</b> a été <b>acceptée</b> par l'organisateur.`
          : `Votre candidature pour l'événement <b>${event.title}</b> a été <b>refusée</b> par l'organisateur.`}
      </p>
      <div style="margin: 24px 0; padding: 18px; background: #f0f0f0; border-radius: 8px;">
        <b>Message de l'organisateur :</b><br/>
        <i>${organizerMessage ? organizerMessage : '(Aucun message personnalisé)'}</i>
      </div>
      <div style="margin: 24px 0; padding: 18px; background: #e3f2fd; border-radius: 8px;">
        <b>Détails de l'événement :</b><br/>
        <span>📅 <b>${event.title}</b></span><br/>
        <span>🗓️ ${new Date(event.date).toLocaleDateString('fr-FR')}</span><br/>
        <span>📍 ${event.location.address}, ${event.location.city}</span>
      </div>
      <div style="text-align: center; margin-top: 32px;">
        <a href="https://standup-comedy-app.netlify.app/applications" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #667eea, #764ba2); color: white; border-radius: 24px; text-decoration: none; font-weight: bold; font-size: 1.1em;">Voir mes candidatures</a>
      </div>
      <p style="text-align: center; color: #888; margin-top: 32px; font-size: 0.95em;">L'équipe Standup Comedy Connect</p>
    </div>
  </div>
  `;

  const mailOptions = {
    from: `"${organizer.firstName} ${organizer.lastName}" <${config.email.smtpUser}>`,
    to: comedian.email,
    subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}; 

// Notifier les humoristes ayant déjà postulé quand un événement est modifié
export const sendEventUpdatedNotificationToApplicants = async (
  applications: Array<{ _id: string; comedian: any }>,
  event: any,
  organizer: { firstName: string; lastName: string; email: string }
) => {
  if (!applications || applications.length === 0) return;

  const subject = `✏️ Mise à jour de l'événement "${event.title}"`;
  const frontendBase = 'https://standup-comedy-app.netlify.app';

  const sendAll = applications.map((app: any) => {
    const comedian = app.comedian;
    if (!comedian?.email) return Promise.resolve();
    const loginUrl = `${frontendBase}/login?redirect=/applications`;

    const html = `
    <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); padding: 24px;">
        <h2 style="margin-top:0">✏️ L'organisateur a modifié un événement</h2>
        <p>Bonjour ${comedian.firstName || ''},</p>
        <p>L'événement auquel vous avez postulé a été mis à jour par <b>${organizer.firstName} ${organizer.lastName}</b>.</p>
        <div style="margin: 16px 0; padding: 16px; background:#e3f2fd; border-left: 4px solid #2196f3; border-radius: 8px;">
          <div><b>📛 Titre:</b> ${event.title}</div>
          <div><b>📅 Date:</b> ${new Date(event.date).toLocaleDateString('fr-FR')}</div>
          <div><b>📍 Lieu:</b> ${event.location?.address || ''} ${event.location?.city ? `- ${event.location.city}` : ''}</div>
          ${event.startTime ? `<div><b>⏰ Heure:</b> ${event.startTime}</div>` : ''}
        </div>
        <p>Pour confirmer si vous restez inscrit ou vous désinscrire, connectez-vous sur votre espace candidatures.</p>
        <div style="text-align:center; margin-top: 20px;">
          <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;background:#667eea;color:#fff;border-radius:24px;text-decoration:none;font-weight:bold">Se connecter</a>
        </div>
        <p style="color:#888; margin-top:24px;">Cet email est automatique. Merci de ne pas y répondre.</p>
      </div>
    </div>`;

    return transporter.sendMail({
      from: `"${organizer.firstName} ${organizer.lastName}" <${config.email.smtpUser}>`,
      replyTo: organizer.email,
      to: comedian.email,
      subject,
      html,
    });
  });

  await Promise.all(sendAll);
};

export const sendEventReminder = async (
  comedian: { email: string; firstName?: string; lastName?: string },
  event: { title: string; date: Date; location?: any; startTime?: string },
  type: 'J-3' | 'J-1' | '-2H'
) => {
  const subjectMap = {
    'J-3': `⏳ Rappel J-3: "${event.title}" approche !`,
    'J-1': `📅 Rappel veille: "${event.title}" c'est demain`,
    '-2H': `⏰ Rappel: "${event.title}" commence dans 2 heures`,
  } as const;

  const html = `
  <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 24px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); padding: 24px;">
      <h2 style="margin-top:0;">${subjectMap[type]}</h2>
      <p>Bonjour ${comedian.firstName || ''},</p>
      <p>Vous êtes <b>accepté</b> pour l'événement <b>${event.title}</b>.</p>
      <div style="margin: 16px 0; padding: 16px; background:#e3f2fd; border-left: 4px solid #2196f3; border-radius: 8px;">
        <div><b>📅 Date:</b> ${new Date(event.date).toLocaleDateString('fr-FR')}</div>
        ${event.startTime ? `<div><b>⏰ Heure:</b> ${event.startTime}</div>` : ''}
        ${event.location ? `<div><b>📍 Lieu:</b> ${event.location.address || ''} ${event.location.city ? `- ${event.location.city}` : ''}</div>` : ''}
      </div>
      <p>Nous vous souhaitons une excellente performance !</p>
      <div style="text-align:center; margin-top: 12px;">
        <a href="https://standup-comedy-app.netlify.app/applications" style="display:inline-block;padding:12px 24px;background:#667eea;color:#fff;border-radius:24px;text-decoration:none;font-weight:bold">Voir mes candidatures</a>
      </div>
      <p style="color:#888; margin-top:16px;">Cet email est automatique. Merci de ne pas y répondre.</p>
    </div>
  </div>`;

  await transporter.sendMail({
    from: `Standup Comedy <${config.email.smtpUser}>`,
    to: comedian.email,
    subject: subjectMap[type],
    html,
  });
};