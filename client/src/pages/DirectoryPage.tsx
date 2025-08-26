import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import ComedianApplicationsModal from '../components/ComedianApplicationsModal';

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      alert('Impossible de charger le répertoire des utilisateurs');
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

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedComedian(null);
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
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
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
                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                      Inscrit le {new Date(userData.createdAt).toLocaleDateString('fr-FR')}
                    </p>
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
    </div>
  );
};

export default DirectoryPage; 