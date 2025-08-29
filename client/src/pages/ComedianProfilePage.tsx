import { type CSSProperties, useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import type { IUserData } from '../types/user';
import EditComedianProfileForm from '../components/EditComedianProfileForm';

function ComedianProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState<IUserData | null>(authUser);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  const handleSaveSuccess = () => {
    refreshUser();
    setIsEditing(false);
  };

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

  const sectionContainerStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr',
    gap: '20px',
    alignItems: 'flex-start',
  };

  const cardStyle: CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '18px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  };

  const cardTitleStyle: CSSProperties = {
    fontSize: '1.3em',
    color: '#ff4b2b',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
  };

  const infoRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: '8px',
    flexWrap: 'wrap',
  };

  const infoLabelStyle: CSSProperties = {
    fontWeight: 'bold',
    color: '#ccc',
    fontSize: '0.95em',
  };

  const infoValueStyle: CSSProperties = {
    color: '#fff',
    fontSize: '0.95em',
    textAlign: 'right',
    maxWidth: '60%',
  };

  const profileCardStyle: CSSProperties = {
    ...cardStyle,
    textAlign: 'center',
  };

  const avatarStyle: CSSProperties = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#ff416c',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '3em',
    fontWeight: 'bold',
    margin: '0 auto 15px auto',
  };

  const statsValueStyle: CSSProperties = {
    fontSize: '1.2em',
    color: '#ff416c',
    fontWeight: 'bold',
  };

  const editButtonStyle: CSSProperties = {
    padding: '8px 15px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
    color: 'white',
    fontSize: '0.9em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    marginLeft: '10px',
  };

  return (
    <div style={mainContainerStyle}>
      <Navbar />

      <div style={pageHeaderStyle}>
        <div>
          <h1 style={titleStyle}>Mon Profil Humoriste</h1>
          <p style={subtitleStyle}>Gère tes informations et préférences en tant qu'humoriste</p>
        </div>
        <button style={editButtonStyle} onClick={() => setIsEditing(true)}>Modifier</button>
      </div>

      {isEditing && user ? (
        <EditComedianProfileForm
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          currentUser={user}
          onSaveSuccess={handleSaveSuccess}
        />
      ) : (
        <div style={sectionContainerStyle}>
          {/* Informations personnelles */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>
              <i className="fas fa-user-circle" style={{ marginRight: '10px' }}></i> Informations personnelles
            </h2>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Prénom</span>
              <span style={infoValueStyle}>{user?.firstName || 'Non défini'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Nom</span>
              <span style={infoValueStyle}>{user?.lastName || 'Non défini'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Email</span>
              <span style={infoValueStyle}>{user?.email || 'Non défini'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Ville</span>
              <span style={infoValueStyle}>{user?.city || 'Non défini'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Téléphone</span>
              <span style={infoValueStyle}>{user?.phone || 'Non défini'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Adresse</span>
              <span style={infoValueStyle}>{user?.address || 'Non définie'}</span>
            </div>
          </div>

          {/* Profil principal (avatar et rôle) */}
          <div style={profileCardStyle}>
            <div style={avatarStyle}>
              {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'DA'}
            </div>
            <h3 style={{ color: '#ffffff', marginBottom: '5px' }}>{user ? `${user.firstName} ${user.lastName}` : 'Nom Humoriste'}</h3>
            <p style={{ color: '#ff4b2b', fontSize: '1.1em', fontWeight: 'bold' }}>{user?.role || 'Humoriste'}</p>

            {/* Stats rapides */}
            <h4 style={{ color: '#ff4b2b', marginTop: '30px', marginBottom: '15px' }}>Stats rapides</h4>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Candidatures acceptées</span>
              <span style={statsValueStyle}>{user?.stats?.applicationsAccepted || 0}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Net Promoter Score</span>
              <span style={statsValueStyle}>{user?.stats?.netPromoterScore || 0}</span>
            </div>
          </div>

          {/* Profil Humoriste */}
          <div style={{ ...cardStyle, gridColumn: window.innerWidth < 768 ? 'span 1' : 'span 2' }}>
            <h2 style={cardTitleStyle}>Profil Humoriste</h2>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Bio:</span>
              <span style={infoValueStyle}>{user?.profile?.bio || 'Non spécifié'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Expérience (années):</span>
              <span style={infoValueStyle}>{user?.profile?.experience !== undefined ? `${user.profile.experience} ans` : 'Non spécifié'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Spécialité:</span>
              <span style={infoValueStyle}>{user?.profile?.speciality || 'Non spécifié'}</span>
            </div>
            <button style={{ ...editButtonStyle, marginTop: '20px' }} onClick={() => setIsEditing(true)}>MODIFIER</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComedianProfilePage; 