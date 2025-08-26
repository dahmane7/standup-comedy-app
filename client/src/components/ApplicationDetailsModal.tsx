import { type CSSProperties } from 'react';
import Modal from './Modal';
import type { IApplication } from '../pages/ApplicationsPage';

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: IApplication | null;
}

function ApplicationDetailsModal({ isOpen, onClose, application }: ApplicationDetailsModalProps) {
  if (!application) return null; // Ne rien afficher si aucune application n'est fournie

  const cardDetailStyle: CSSProperties = {
    fontSize: '0.9em',
    color: '#ccc',
    marginBottom: '5px',
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: '1.2em',
    color: '#ff416c',
    marginTop: '15px',
    marginBottom: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '5px',
  };

  const statusBadgeStyle = (status: IApplication['status']): CSSProperties => {
    let backgroundColor = '';
    let color = '#ffffff';
    switch (status) {
      case 'PENDING':
        backgroundColor = '#ffc107'; // yellow
        color = '#333';
        break;
      case 'ACCEPTED':
        backgroundColor = '#28a745'; // green
        break;
      case 'REJECTED':
        backgroundColor = '#dc3545'; // red
        break;
      default:
        backgroundColor = '#6c757d'; // gray
    }
    return {
      display: 'inline-block',
      padding: '5px 10px',
      borderRadius: '5px',
      backgroundColor,
      color,
      fontWeight: 'bold',
      marginTop: '10px',
    };
  };

  const translateStatus = (status: IApplication['status']): string => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      default:
        return status; // Fallback for other statuses
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails de la Candidature">
      <h2 style={{ fontSize: '1.8em', color: '#ff4b2b', marginBottom: '15px' }}>{application.event.title}</h2>
      
      <h3 style={sectionTitleStyle}>Informations Générales</h3>
      <p style={cardDetailStyle}>Statut: <span style={statusBadgeStyle(application.status)}>{translateStatus(application.status)}</span></p>
      <p style={cardDetailStyle}>Date de l'événement: {new Date(application.event.date).toLocaleDateString()}</p>
      {application.event.startTime && <p style={cardDetailStyle}>Heure de l'événement: {application.event.startTime}</p>}
      {application.event.location && <p style={cardDetailStyle}>Lieu: {application.event.location.address}, {application.event.location.city}</p>}
      {application.performanceDetails?.duration && <p style={cardDetailStyle}>Durée Proposée: {application.performanceDetails.duration} min</p>}

      {/* Section Organisateur */}
      {application.event.organizer && (
        <>
          <h3 style={sectionTitleStyle}>Informations de l'Organisateur</h3>
          <p style={cardDetailStyle}>Nom: {application.event.organizer.firstName} {application.event.organizer.lastName}</p>
          <p style={cardDetailStyle}>Email: {application.event.organizer.email}</p>
        </>
      )}

      <h3 style={sectionTitleStyle}>Informations de l'Humoriste</h3>
      <p style={cardDetailStyle}>Nom: {application.comedian.firstName} {application.comedian.lastName}</p>
      <p style={cardDetailStyle}>Email: {application.comedian.email}</p>
      {application.comedian.phone && <p style={cardDetailStyle}>Téléphone: {application.comedian.phone}</p>}
      {application.comedian.profile?.bio && <p style={cardDetailStyle}>Bio: {application.comedian.profile.bio}</p>}
      {application.comedian.profile?.experience !== undefined && <p style={cardDetailStyle}>Expérience: {application.comedian.profile.experience} ans</p>}
      {application.comedian.profile?.speciality && <p style={cardDetailStyle}>Spécialité: {application.comedian.profile.speciality}</p>}

      {application.performanceDetails && (
        <>
          <h3 style={sectionTitleStyle}>Détails de la Performance</h3>
          <p style={cardDetailStyle}>Description: {application.performanceDetails.description}</p>
          {application.performanceDetails.videoLink && (
            <p style={cardDetailStyle}>Lien vidéo: <a href={application.performanceDetails.videoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#ff4b2b' }}>Voir la vidéo</a></p>
          )}
        </>
      )}
      
      {application.message && (
        <>
          <h3 style={sectionTitleStyle}>Message de l'Humoriste</h3>
          <p style={cardDetailStyle}>{application.message}</p>
        </>
      )}

      {application.organizerMessage && (
        <>
          <h3 style={sectionTitleStyle}>Message de l'Organisateur</h3>
          <p style={cardDetailStyle}>{application.organizerMessage}</p>
        </>
      )}
    </Modal>
  );
}

export default ApplicationDetailsModal; 