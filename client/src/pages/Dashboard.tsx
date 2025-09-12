import { type CSSProperties, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth'; // Import useAuth
import { useNavigate } from 'react-router-dom'; // Importer useNavigate
import axios from 'axios';

interface EventStats {
  totalEvents: number;
  upcomingIncompleteEvents: number;
  completedEvents: number;
  cancelledEvents?: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
}

const Dashboard = () => {
  const { user } = useAuth(); // Get user from useAuth for createdEvents
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const navigate = useNavigate(); // Initialiser useNavigate

  // Fonction pour récupérer les statistiques
  const fetchEventStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Vous devez être connecté pour voir les statistiques d'événements.");
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Erreur API: ${errorData.message || res.statusText}`);
      }

      const data = await res.json();
      console.log('📊 Statistiques reçues du serveur:', data);
      console.log('👤 Rôle utilisateur:', (user as any)?.role);
      setEventStats(data);
    } catch (err: any) {
      console.error("Erreur fetch event stats:", err);
      setError(err.message || "Erreur lors du chargement des statistiques.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour traiter les événements terminés (Super Admin uniquement)
  const handleProcessCompletedEvents = async () => {
    if (!user || (user as any)?.role !== 'SUPER_ADMIN') {
      alert('Accès refusé. Seuls les super-admins peuvent effectuer cette action.');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/events/process-completed-events`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data;
      alert(`✅ Traitement terminé !\n${result.participationsAdded} participations ajoutées sur ${result.eventsProcessed} événements traités.`);
      
      // Recharger les statistiques après traitement
      await fetchEventStats();
    } catch (error: any) {
      console.error('Erreur lors du traitement:', error);
      alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (user) { // Fetch only if user is available
      fetchEventStats();
    }
  }, [user]); // Re-run effect if user changes

  // Styles de base pour le conteneur principal
  const mainContainerStyle: CSSProperties = {
    minHeight: '100vh',
    color: '#ffffff',
    padding: '20px',
    background: 'linear-gradient(to bottom right, #1a1a2e, #331f41)', // Dégradé du login
  };

  // Styles pour l'en-tête du tableau de bord
  const dashboardHeaderStyle: CSSProperties = {
    fontSize: '3rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '40px',
    background: 'linear-gradient(135deg, #ff4b2b, #ff416c)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 4px 8px rgba(255, 75, 43, 0.3)',
  };

  // Styles pour la grille des cartes
  const cardsGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
  };

  // Style de base pour toutes les cartes
  const cardStyle: CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  const cardTitleStyle: CSSProperties = {
    fontSize: '1.1rem',
    color: '#B0B0B0',
    marginBottom: '10px',
    fontWeight: '500',
  };

  const cardValueStyle: CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '5px',
  };

  const cardIconStyle: CSSProperties = {
    fontSize: '3rem',
    opacity: 0.7,
  };

  if (!user || loading) {
    return (
      <div style={mainContainerStyle}>
        <Navbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 60px)' // Adjust based on navbar height
        }}>
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={mainContainerStyle}>
        <Navbar />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 60px)',
          color: '#dc3545'
        }}>
          <p>Erreur lors du chargement des statistiques: {error}</p>
        </div>
      </div>
    );
  }

  // Calcul des statistiques des humoristes postulants
  const totalHumoristApplicants = (eventStats?.acceptedApplications || 0) + (eventStats?.rejectedApplications || 0);
  const acceptedPercentage = totalHumoristApplicants > 0 ? (((eventStats?.acceptedApplications || 0) / totalHumoristApplicants) * 100).toFixed(1) : 0;
  const rejectedPercentage = totalHumoristApplicants > 0 ? (((eventStats?.rejectedApplications || 0) / totalHumoristApplicants) * 100).toFixed(1) : 0;

  // Déterminer le titre selon le rôle de l'utilisateur
  const dashboardTitle = (user as any)?.role === 'SUPER_ADMIN' 
    ? 'Tableau de bord Super Administrateur' 
    : 'Tableau de bord de l\'organisateur';

  return (
    <div style={mainContainerStyle}>
      <Navbar />
      <div style={{ marginTop: '80px' }}>
        <h1 style={dashboardHeaderStyle}>{dashboardTitle}</h1>
        
        <div style={cardsGridStyle}>
          {/* Carte : Événements créés */}
          <div 
            style={{ ...cardStyle, cursor: 'pointer' }} 
            onClick={() => navigate('/events?status=ALL')}
          >
            <div>
              <p style={cardTitleStyle}>Événements créés</p>
              <p style={cardValueStyle}>{eventStats?.totalEvents || 0}</p>
            </div>
            <span style={cardIconStyle}>🎪</span>
          </div>

          {/* Carte : Candidatures en attente */}
          <div 
            style={{ ...cardStyle, cursor: 'pointer' }} 
            onClick={() => navigate('/applications')}
          >
            <div>
              <p style={cardTitleStyle}>Candidatures en attente</p>
              <p style={cardValueStyle}>{eventStats?.pendingApplications || 0}</p>
            </div>
            <span style={cardIconStyle}>⏳</span>
          </div>

          {/* Carte : Humoristes postulants */}
          <div 
            style={{ ...cardStyle, cursor: 'pointer' }} 
            onClick={() => navigate('/applications')}
          >
            <div>
              <p style={cardTitleStyle}>Humoristes postulants</p>
              <p style={cardValueStyle}>{totalHumoristApplicants}</p>
              <div style={{ fontSize: '0.9rem', color: '#B0B0B0', marginTop: '10px' }}>
                <div>✅ Acceptées: {eventStats?.acceptedApplications || 0} ({acceptedPercentage}%)</div>
                <div>❌ Refusées: {eventStats?.rejectedApplications || 0} ({rejectedPercentage}%)</div>
              </div>
            </div>
            <span style={cardIconStyle}>👥</span>
          </div>

          {/* Carte : Prochains événements (non complets) */}
          <div 
            style={{ ...cardStyle, cursor: 'pointer' }} 
            onClick={() => navigate('/events?status=UPCOMING&incomplete=true')}
          >
            <div>
              <p style={cardTitleStyle}>Prochains événements<br/>(non complets)</p>
              <p style={cardValueStyle}>{eventStats?.upcomingIncompleteEvents || 0}</p>
            </div>
            <span style={cardIconStyle}>✨</span>
          </div>

          {/* Carte : Événements complets */}
          <div 
            style={{ ...cardStyle, cursor: 'pointer' }} 
            onClick={() => navigate('/events?status=COMPLETED&date=past')}
          >
            <div>
              <p style={cardTitleStyle}>Événements complets</p>
              <p style={cardValueStyle}>{eventStats?.completedEvents || 0}</p>
            </div>
            <span style={cardIconStyle}>✅</span>
          </div>

          {/* Carte : Événements archivés */}
          <div 
            style={{ ...cardStyle, cursor: 'pointer' }} 
            onClick={() => navigate('/events?status=COMPLETED&date=past')}
          >
            <div>
              <p style={cardTitleStyle}>Événements archivés</p>
              <p style={cardValueStyle}>{eventStats?.completedEvents || 0}</p>
            </div>
            <span style={cardIconStyle}>📦</span>
          </div>

          {/* Carte : Événements annulés */}
          <div 
            style={{ ...cardStyle, cursor: 'pointer' }} 
            onClick={() => navigate('/events?status=CANCELLED')}
          >
            <div>
              <p style={cardTitleStyle}>Événements annulés</p>
              <p style={cardValueStyle}>{eventStats?.cancelledEvents || 0}</p>
            </div>
            <span style={cardIconStyle}>🛑</span>
          </div>

          {/* Carte de traitement automatique pour Super Admin uniquement */}
          {(user as any)?.role === 'SUPER_ADMIN' && (
            <div style={{
              ...cardStyle,
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(219, 39, 119, 0.2))',
              border: '1px solid rgba(147, 51, 234, 0.3)',
              textAlign: 'center',
              cursor: 'pointer'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span style={{
                  fontSize: '3rem',
                  opacity: 0.8,
                  animation: isProcessing ? 'spin 1s linear infinite' : 'none'
                }}>
                  🔄
                </span>
                <div>
                  <p style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '10px'
                  }}>
                    Traitement automatique
                  </p>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#B0B0B0',
                    marginBottom: '20px',
                    lineHeight: 1.4
                  }}>
                    Mettre à jour les participations pour les événements terminés
                  </p>
                </div>
                <button
                  onClick={handleProcessCompletedEvents}
                  disabled={isProcessing}
                  style={{
                    padding: '12px 24px',
                    background: isProcessing 
                      ? 'linear-gradient(135deg, #6b7280, #9ca3af)' 
                      : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{
                    fontSize: '1rem',
                    animation: isProcessing ? 'spin 1s linear infinite' : 'none'
                  }}>
                    🔄
                  </span>
                  {isProcessing ? 'Traitement...' : 'Traiter les événements'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard; 