import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import ComedianApplicationsModal from '../components/ComedianApplicationsModal';
import api from '../services/api';

interface UserStats {
  totalEvents?: number;
  totalRevenue?: number;
  averageRating?: number;
  viralScore?: number;
  profileViews?: number;
  lastActivity?: string;
  applicationsSent?: number;
  applicationsAccepted?: number;
  applicationsRejected?: number;
  applicationsPending?: number;
  netPromoterScore?: number;
  absences?: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'COMEDIAN' | 'ORGANIZER';
  city: string;
  createdAt: string;
  stageName?: string;
  experienceLevel?: string;
  companyName?: string;
  address?: string; // Added for organizers
  stats?: UserStats; // Ajout des statistiques
}

const DirectoryPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComedian, setSelectedComedian] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user } = useAuth();

  // Styles
  const mainContainerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif',
  };

  const contentStyle = {
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const titleStyle = {
    fontSize: '2.5em',
    marginBottom: '10px',
    color: '#ffffff',
    textAlign: 'center' as const,
    fontWeight: 'bold',
  };

  const subtitleStyle = {
    fontSize: '1.2em',
    color: '#ffffff',
    textAlign: 'center' as const,
    marginBottom: '40px',
    opacity: 0.9,
  };

  const filtersStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  };

  const inputStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    minWidth: '250px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  };

  const selectStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
    cursor: 'pointer',
  };

  const statsStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  };

  const statCardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center' as const,
    minWidth: '150px',
  };

  const usersGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  };

  const userCardStyle = (userData: User) => ({
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: userData.role === 'COMEDIAN' ? 'pointer' : 'default',
    border: userData.role === 'COMEDIAN' ? '2px solid transparent' : '1px solid #eee',
  });

  const badgeStyle = (role: string) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: role === 'COMEDIAN' ? '#9c27b0' : '#2196f3',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des utilisateurs...');
      console.log('👤 Utilisateur actuel:', user);
      
      const response = await api.get('/auth/users');
      console.log('📊 Réponse API reçue:', response.data);
      
      setUsers(response.data.users || []);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      console.error('📋 Détails de l\'erreur:', error.response?.data);
      console.error('🔢 Status de l\'erreur:', error.response?.status);
      
      let errorMessage = 'Erreur inconnue';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Impossible de charger le répertoire des utilisateurs: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.stageName && user.stageName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.companyName && user.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrer par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'COMEDIAN':
        return 'Humoriste';
      case 'ORGANIZER':
        return 'Organisateur';
      default:
        return role;
    }
  };

  const handleComedianClick = (userData: User) => {
    if (userData.role === 'COMEDIAN') {
      setSelectedComedian({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      });
      setIsModalOpen(true);
    }
  };

  const handleUserStatsClick = (userData: User, event: React.MouseEvent) => {
    event.stopPropagation(); // Empêcher le clic sur la modal des candidatures
    setSelectedUser(userData);
    setIsStatsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedComedian(null);
  };

  const closeStatsModal = () => {
    setIsStatsModalOpen(false);
    setSelectedUser(null);
  };

  const calculateSuccessRate = (stats?: UserStats) => {
    if (!stats || !stats.applicationsSent) return 0;
    const accepted = stats.applicationsAccepted || 0;
    return Math.round((accepted / stats.applicationsSent) * 100);
  };

  // Vérifier l'accès super admin
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div style={mainContainerStyle}>
        <Navbar />
        <div style={contentStyle}>
          <h1 style={titleStyle}>Accès refusé</h1>
          <p style={subtitleStyle}>Seuls les super administrateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={mainContainerStyle}>
        <Navbar />
        <div style={contentStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}></div>
              <p style={{ color: '#ffffff', fontSize: '18px' }}>Chargement du répertoire...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={mainContainerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .user-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }
          .user-card[data-role="COMEDIAN"]:hover {
            border-color: #9c27b0 !important;
            box-shadow: 0 6px 20px rgba(156, 39, 176, 0.2);
          }
        `}
      </style>
      <Navbar />
      
      <div style={contentStyle}>
        {/* En-tête */}
        <h1 style={titleStyle}>📋 Répertoire des Utilisateurs</h1>
        <p style={subtitleStyle}>
          Liste complète des humoristes et organisateurs inscrits sur la plateforme
        </p>

        {/* Statistiques */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#9c27b0' }}>Humoristes</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {users.filter(u => u.role === 'COMEDIAN').length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2196f3' }}>Organisateurs</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {users.filter(u => u.role === 'ORGANIZER').length}
            </p>
          </div>
          <div style={statCardStyle}>
            <h3 style={{ margin: '0 0 10px 0', color: '#4caf50' }}>Total</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {users.length}
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div style={filtersStyle}>
          <input
            type="text"
            placeholder="Rechercher par nom, email, nom de scène..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          <select
            value={roleFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">Tous les rôles</option>
            <option value="COMEDIAN">Humoristes</option>
            <option value="ORGANIZER">Organisateurs</option>
          </select>
          <button
            onClick={loadUsers}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ff4b2b',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            🔄 Actualiser
          </button>
        </div>

        {/* Résultats */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            padding: '8px 16px', 
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Affichage: {filteredUsers.length} / {users.length} utilisateurs
          </span>
        </div>

        {/* Liste des utilisateurs */}
        {filteredUsers.length > 0 ? (
          <div style={usersGridStyle}>
            {filteredUsers.map((userData) => (
              <div 
                key={userData.id} 
                className="user-card" 
                style={userCardStyle(userData)}
                data-role={userData.role}
                onClick={() => handleComedianClick(userData)}
              >
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                      {userData.firstName} {userData.lastName}
                      {userData.role === 'COMEDIAN' && (
                        <span style={{ marginLeft: '8px', fontSize: '14px', color: '#9c27b0' }}>
                          👆 Cliquer pour voir les participations et absences
                        </span>
                      )}
                    </h3>
                    {userData.stageName && (
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#9c27b0', fontWeight: 'bold' }}>
                        "{userData.stageName}"
                      </p>
                    )}
                    {userData.companyName && (
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#2196f3', fontWeight: 'bold' }}>
                        {userData.companyName}
                      </p>
                    )}
                  </div>
                  <span style={badgeStyle(userData.role)}>
                    {getRoleLabel(userData.role)}
                  </span>
                </div>

                <div style={{ gap: '10px' }}>
                  <p style={{ margin: '8px 0', fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>📧</span>
                    {userData.email}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>📞</span>
                    {userData.phone || 'Non renseigné'}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>📍</span>
                    {userData.city || 'Non renseigné'}
                  </p>

                  {userData.experienceLevel && (
                    <p style={{ margin: '8px 0', fontSize: '14px', color: '#555' }}>
                      <strong>Expérience:</strong> {userData.experienceLevel}
                    </p>
                  )}

                  <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                        Inscrit le {new Date(userData.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      <button
                        onClick={(e) => handleUserStatsClick(userData, e)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = '#45a049'}
                        onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = '#4caf50'}
                      >
                        📊 Voir statistiques
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
            <h3 style={{ color: '#ffffff', fontSize: '24px', marginBottom: '10px' }}>
              Aucun utilisateur trouvé
            </h3>
            <p style={{ color: '#ffffff', opacity: 0.8 }}>
              {searchTerm || roleFilter !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucun utilisateur inscrit pour le moment'}
            </p>
          </div>
        )}
      </div>

      {/* Modale des candidatures */}
      <ComedianApplicationsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        comedian={selectedComedian}
      />

      {/* Modal des statistiques utilisateur */}
      {isStatsModalOpen && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '32px' }}>📊</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: selectedUser.role === 'COMEDIAN' ? '#9c27b0' : '#2196f3',
                    marginTop: '5px'
                  }}>
                    {getRoleLabel(selectedUser.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={closeStatsModal}
                style={{
                  backgroundColor: '#ff4757',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Informations générales */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👤 Informations générales
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '15px',
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📧</span>
                  <span style={{ fontSize: '14px' }}>{selectedUser.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📞</span>
                  <span style={{ fontSize: '14px' }}>{selectedUser.phone || 'Non renseigné'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍</span>
                  <span style={{ fontSize: '14px' }}>{selectedUser.city || 'Non renseigné'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📅</span>
                  <span style={{ fontSize: '14px' }}>Inscrit le {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              
              {selectedUser.stageName && (
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#9c27b0' }}>
                    🎭 Nom de scène: "{selectedUser.stageName}"
                  </span>
                </div>
              )}
              
              {selectedUser.companyName && (
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2196f3' }}>
                    🏢 Entreprise: {selectedUser.companyName}
                  </span>
                </div>
              )}
            </div>

            {/* Statistiques de performance */}
            {selectedUser.role === 'COMEDIAN' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📈 Statistiques de performance
                </h3>
                
                {/* Métriques principales */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px',
                  marginBottom: '25px'
                }}>
                  <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3', marginBottom: '5px' }}>
                      {selectedUser.stats?.totalEvents || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#1976d2' }}>Événements participés</div>
                  </div>

                  <div style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9c27b0', marginBottom: '5px' }}>
                      {selectedUser.stats?.applicationsSent || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7b1fa2' }}>Candidatures envoyées</div>
                  </div>

                  <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50', marginBottom: '5px' }}>
                      {selectedUser.stats?.applicationsAccepted || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#2e7d32' }}>
                      Acceptées ({calculateSuccessRate(selectedUser.stats)}% de succès)
                    </div>
                  </div>

                  <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800', marginBottom: '5px' }}>
                      {selectedUser.stats?.viralScore || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#f57c00' }}>Score viral</div>
                  </div>
                </div>

                {/* Statistiques détaillées */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '15px',
                  marginBottom: '25px'
                }}>
                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', marginBottom: '5px' }}>❌</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                      {selectedUser.stats?.applicationsRejected || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Candidatures rejetées</div>
                  </div>

                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', marginBottom: '5px' }}>⏳</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800' }}>
                      {selectedUser.stats?.applicationsPending || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>En attente</div>
                  </div>

                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', marginBottom: '5px' }}>😴</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                      {selectedUser.stats?.absences || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Absences</div>
                  </div>

                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', marginBottom: '5px' }}>👁️</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#607d8b' }}>
                      {selectedUser.stats?.profileViews || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Vues du profil</div>
                  </div>

                  <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', marginBottom: '5px' }}>📊</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#673ab7' }}>
                      {selectedUser.stats?.netPromoterScore || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Score NPS</div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistiques pour organisateurs */}
            {selectedUser.role === 'ORGANIZER' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📊 Statistiques d'organisateur
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px'
                }}>
                  <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3', marginBottom: '5px' }}>
                      {selectedUser.stats?.totalEvents || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#1976d2' }}>Événements organisés</div>
                  </div>

                  <div style={{ padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50', marginBottom: '5px' }}>
                      {selectedUser.stats?.averageRating || 0}/5
                    </div>
                    <div style={{ fontSize: '12px', color: '#2e7d32' }}>Note moyenne</div>
                  </div>

                  <div style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>👁️</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9c27b0', marginBottom: '5px' }}>
                      {selectedUser.stats?.profileViews || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7b1fa2' }}>Vues du profil</div>
                  </div>
                </div>
              </div>
            )}

            {/* Note si pas de statistiques */}
            {(!selectedUser.stats || Object.keys(selectedUser.stats).length === 0) && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginTop: '20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
                <h3 style={{ color: '#666', fontSize: '18px', marginBottom: '10px' }}>
                  Aucune statistique disponible
                </h3>
                <p style={{ color: '#888', fontSize: '14px' }}>
                  Les statistiques seront disponibles une fois que l'utilisateur aura commencé à utiliser la plateforme.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage; 