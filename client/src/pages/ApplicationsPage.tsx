import { type CSSProperties, useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import ApplicationDetailsModal from '../components/ApplicationDetailsModal';

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profile?: { bio?: string; experience?: number; speciality?: string; }; // Ajoutez d'autres champs si nécessaires
}

export interface IEventPopulated {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  location: { address: string; city: string; };
  organizer: IUser; // Change to IUser
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  requirements: { minExperience: number; maxPerformers: number; duration: number; };
}

export interface IApplication {
  _id: string;
  event: IEventPopulated;
  comedian: IUser; // Renamed from applicant to comedian for consistency with backend
  performanceDetails?: { duration: number; description: string; videoLink?: string; }; // Make optional
  message?: string; // Add optional message field
  organizerMessage?: string; // Message de l'organisateur lors de l'acceptation/refus
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

function ApplicationsPage() {
  const { token, user, refreshUser } = useAuth();
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedApplication, setSelectedApplication] = useState<IApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToSet, setStatusToSet] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [statusAppId, setStatusAppId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const [comedianFilter, setComedianFilter] = useState<string>('all');

  const getStatusFromUrlOrTab = () => {
    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get('status');
    if (statusParam && ['PENDING', 'ACCEPTED', 'REJECTED'].includes(statusParam)) {
      return statusParam as 'PENDING' | 'ACCEPTED' | 'REJECTED';
    }
    return 'all';
  };

  useEffect(() => {
    setSelectedTab(getStatusFromUrlOrTab());
  }, [location.search]);

  const fetchApplications = async () => {
    if (!token) {
      setError("Vous devez être connecté pour voir les candidatures.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const res = await api.get<IApplication[]>('/applications', config);
      const list = Array.isArray(res.data)
        ? res.data
        : (Array.isArray((res.data as any)?.applications) ? (res.data as any).applications : []);
      setApplications(list);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des candidatures:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Échec de la récupération des candidatures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token, selectedTab]);

  const openStatusModal = (appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setStatusAppId(appId);
    setStatusToSet(status);
    setStatusMessage('');
    setShowStatusModal(true);
    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusToSet(null);
    setStatusAppId(null);
    setStatusMessage('');
  };

  const handleConfirmStatus = async () => {
    if (!token || !statusAppId || !statusToSet) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await api.put(`/applications/${statusAppId}/status`, { status: statusToSet, organizerMessage: statusMessage }, config);
      alert(`Candidature ${statusToSet === 'ACCEPTED' ? 'acceptée' : 'refusée'} avec succès !`);
      fetchApplications();
      refreshUser();
      closeStatusModal();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du statut:', err.response?.data || err.message);
      alert(`Échec de la mise à jour du statut: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleTabChange = (status: 'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED') => {
    setSelectedTab(status);
    if (status === 'all') {
      navigate('/applications');
    } else {
      navigate(`/applications?status=${status}`);
    }
  };

  // Récupérer la liste unique des humoristes
  const uniqueComedians = Array.from(new Set(applications.map(app => app.comedian ? `${app.comedian._id}::${app.comedian.firstName} ${app.comedian.lastName}` : '')))
    .filter(Boolean)
    .map(str => {
      const [id, name] = str.split('::');
      return { id, name };
    });

  // Fonction de filtrage combinée
  const getFilteredApplications = () => {
    let filtered = applications;
    if (selectedTab !== 'all') {
      filtered = filtered.filter(app => app.status === selectedTab);
    }
    if (comedianFilter !== 'all') {
      filtered = filtered.filter(app => app.comedian && app.comedian._id === comedianFilter);
    }
    return filtered;
  };

  const allApplicationsCount = applications.length;
  const pendingApplicationsCount = applications.filter(app => app.status === 'PENDING').length;
  const acceptedApplicationsCount = applications.filter(app => app.status === 'ACCEPTED').length;
  const rejectedApplicationsCount = applications.filter(app => app.status === 'REJECTED').length;

  const mainContainerStyle: CSSProperties = {
    minHeight: '100vh',
    color: '#ffffff',
    padding: '20px',
    background: 'linear-gradient(to bottom right, #1a1a2e, #331f41)',
  };

  const pageHeaderStyle: CSSProperties = {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  };

  const titleStyle: CSSProperties = {
    fontSize: '2.5em',
    color: '#ff416c',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: '1.1em',
    color: '#aaa',
    marginBottom: '20px',
  };

  const contentContainerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  };

  const applicationsGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  };

  const applicationCardStyle: CSSProperties = {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
  };

  const cardTitleStyle: CSSProperties = {
    fontSize: '1.4em',
    color: '#ff4b2b',
    marginBottom: '10px',
  };

  const cardDetailStyle: CSSProperties = {
    fontSize: '0.9em',
    color: '#ccc',
    marginBottom: '5px',
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
        return status; // Fallback for other statuses not directly related to application (e.g., event status)
    }
  };

  const actionButtonStyle: CSSProperties = {
    padding: '8px 15px',
    borderRadius: '5px',
    border: 'none',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    marginTop: '10px',
    marginRight: '10px',
  };

  const acceptButtonStyle: CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#28a745', // Green
  };

  const rejectButtonStyle: CSSProperties = {
    ...actionButtonStyle,
    backgroundColor: '#dc3545', // Red
  };

  const tabButtonStyle: CSSProperties = {
    padding: '10px 15px',
    borderRadius: '20px',
    border: 'none',
    background: '#331f41',
    color: '#ffffff',
    fontSize: '1em',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease',
    minWidth: '120px',
    textAlign: 'center',
  };

  const activeTabButtonStyle: CSSProperties = {
    ...tabButtonStyle,
    background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
  };

  return (
    <div style={mainContainerStyle}>
      <Navbar />
      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>{user?.role === 'ORGANIZER' ? 'Gérer les Candidatures' : 'Mes Candidatures'}</h1>
          <p style={subtitleStyle}>
            {user?.role === 'ORGANIZER' 
              ? 'Visualisez et gérez toutes les candidatures pour vos événements.'
              : 'Visualisez le statut de vos candidatures.'}
          </p>
        </div>
      </div>

      <div style={contentContainerStyle}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
          {/* Onglets de statut */}
          <button 
            style={selectedTab === 'all' ? activeTabButtonStyle : tabButtonStyle}
            onClick={() => handleTabChange('all')}
          >
            Toutes ({allApplicationsCount})
          </button>
          <button 
            style={selectedTab === 'PENDING' ? activeTabButtonStyle : tabButtonStyle}
            onClick={() => handleTabChange('PENDING')}
          >
            En attente ({pendingApplicationsCount})
          </button>
          <button 
            style={selectedTab === 'ACCEPTED' ? activeTabButtonStyle : tabButtonStyle}
            onClick={() => handleTabChange('ACCEPTED')}
          >
            Acceptées ({acceptedApplicationsCount})
          </button>
          <button 
            style={selectedTab === 'REJECTED' ? activeTabButtonStyle : tabButtonStyle}
            onClick={() => handleTabChange('REJECTED')}
          >
            Refusées ({rejectedApplicationsCount})
          </button>
          {/* Menu déroulant de filtrage par humoriste */}
          <select
            value={comedianFilter}
            onChange={e => setComedianFilter(e.target.value)}
            style={{ marginLeft: 'auto', padding: '8px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff', minWidth: 180 }}
          >
            <option value="all">Tous les humoristes</option>
            {uniqueComedians.map(comedian => (
              <option key={comedian.id} value={comedian.id}>{comedian.name}</option>
            ))}
          </select>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#ccc' }}>Chargement des candidatures...</p>}
        {error && <p style={{ textAlign: 'center', color: '#dc3545' }}>Erreur: {error}</p>}
        {!loading && !error && getFilteredApplications().length === 0 && (
          <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#ccc' }}>
            Aucune candidature trouvée pour ce filtre.
          </p>
        )}

        {!loading && !error && getFilteredApplications().length > 0 && (
          <div style={applicationsGridStyle}>
            {getFilteredApplications()
              .filter(app => app.event)
              .map((app) => (
              <div 
                key={app._id} 
                style={applicationCardStyle}
                onClick={() => {
                  setSelectedApplication(app);
                  setIsModalOpen(true);
                }}
              >
                <div>
                  <h3 style={cardTitleStyle}>{app.event.title}</h3>
                  {user?.role === 'ORGANIZER' && (
                    <>
                      <p style={cardDetailStyle}>Humoriste: {app.comedian.firstName} {app.comedian.lastName}</p>
                      <p style={cardDetailStyle}>Email: {app.comedian.email}</p>
                      {app.comedian.profile?.bio && <p style={cardDetailStyle}>Bio: {app.comedian.profile.bio}</p>}
                      {app.comedian.profile?.experience !== undefined && <p style={cardDetailStyle}>Expérience: {app.comedian.profile.experience} ans</p>}
                      {app.comedian.profile?.speciality && <p style={cardDetailStyle}>Spécialité: {app.comedian.profile.speciality}</p>}
                    </>
                  )}
                  {user?.role === 'COMEDIAN' && (
                    <>
                      <p style={cardDetailStyle}>Organisateur: {app.event.organizer.firstName} {app.event.organizer.lastName}</p>
                    </>
                  )}
                  <p style={cardDetailStyle}>Date de l'événement: {new Date(app.event.date).toLocaleDateString()}</p>
                  {app.performanceDetails && (
                    <>
                      <p style={cardDetailStyle}>Durée proposée: {app.performanceDetails.duration} min</p>
                      <p style={cardDetailStyle}>Description: {app.performanceDetails.description}</p>
                      {app.performanceDetails.videoLink && <p style={cardDetailStyle}>Lien vidéo: <a href={app.performanceDetails.videoLink} target="_blank" rel="noopener noreferrer" style={{ color: '#ff4b2b' }}>Voir la vidéo</a></p>}
                    </>
                  )}
                  {app.message && <p style={cardDetailStyle}>Message: {app.message}</p>}
                  <span style={statusBadgeStyle(app.status)}>Statut: {translateStatus(app.status)}</span>
                </div>
                {user?.role === 'ORGANIZER' && app.status === 'PENDING' && (
                  <div style={{ marginTop: '15px' }}>
                    <button style={acceptButtonStyle} onClick={(e) => { e.stopPropagation(); openStatusModal(app._id, 'ACCEPTED'); }}>Accepter</button>
                    <button style={rejectButtonStyle} onClick={(e) => { e.stopPropagation(); openStatusModal(app._id, 'REJECTED'); }}>Refuser</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedApplication && (
        <ApplicationDetailsModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          application={selectedApplication}
        />
      )}
      {showStatusModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: 30, borderRadius: 10, minWidth: 320, maxWidth: 400 }}>
            <h2 style={{ color: '#ff416c', marginBottom: 15 }}>
              {statusToSet === 'ACCEPTED' ? 'Accepter la candidature' : 'Refuser la candidature'}
            </h2>
            <label style={{ color: '#333', fontWeight: 500 }}>Message (optionnel) :</label>
            <textarea
              ref={messageInputRef as any}
              value={statusMessage}
              onChange={e => setStatusMessage(e.target.value)}
              rows={4}
              style={{ width: '100%', margin: '10px 0 20px 0', borderRadius: 6, border: '1px solid #ccc', padding: 8 }}
              placeholder={statusToSet === 'ACCEPTED' ? 'Message pour l\'humoriste (optionnel)' : 'Motif du refus (optionnel)'}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeStatusModal} style={{ ...actionButtonStyle, background: '#aaa', color: '#fff' }}>Annuler</button>
              <button onClick={handleConfirmStatus} style={{ ...actionButtonStyle, background: statusToSet === 'ACCEPTED' ? '#28a745' : '#dc3545' }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationsPage; 