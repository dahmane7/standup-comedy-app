import { type CSSProperties, useState, useEffect } from 'react';
import Modal from './Modal';
import type { IUserData } from '../types/user';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface ComedianDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comedian: IUserData | null;
}

interface Absence {
  _id: string;
  event: {
    _id: string;
    title: string;
    date: string;
    location: string;
  };
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reason?: string;
  markedAt: string;
}

function ComedianDetailsModal({ isOpen, onClose, comedian }: ComedianDetailsModalProps) {
  const { token } = useAuth();
  const [applicationStats, setApplicationStats] = useState<{
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  } | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAbsences, setLoadingAbsences] = useState(false);

  // Récupérer les vraies statistiques des candidatures
  useEffect(() => {
    if (isOpen && comedian?._id && token) {
      setLoading(true);
      const fetchApplicationStats = async () => {
        try {
          console.log('🔍 DEBUT DEBUG - Récupération des candidatures pour:', {
            comedianId: comedian._id,
            comedianName: `${comedian.firstName} ${comedian.lastName}`
          });

          // Pour un super admin, récupérer toutes les candidatures et filtrer côté client
          const response = await api.get('/applications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const allApplications = Array.isArray(response.data) ? response.data : (Array.isArray((response.data as any)?.applications) ? (response.data as any).applications : []);
          console.log('📊 Toutes les applications reçues:', allApplications);
          console.log('📊 Nombre total d\'applications:', allApplications.length);
          
          // Filtrer les candidatures pour ce humoriste spécifique
          const applications = allApplications.filter((app: any) => {
            const appComedianId = app.comedian?._id || app.comedian;
            console.log(`   Comparaison: ${appComedianId} === ${comedian._id} ?`, appComedianId === comedian._id);
            return appComedianId === comedian._id;
          });
          
          console.log('📊 Applications filtrées pour ce humoriste:', applications);
          console.log('📊 Nombre d\'applications pour ce humoriste:', applications.length);
          
          // Debug chaque application du humoriste
          applications.forEach((app: any, index: number) => {
            console.log(`   Application ${index + 1}:`, {
              id: app._id,
              status: app.status,
              comedianId: app.comedian?._id || app.comedian,
              eventTitle: app.event?.title
            });
          });
          
          const stats = {
            total: applications.length,
            accepted: applications.filter((app: any) => app.status === 'ACCEPTED').length,
            rejected: applications.filter((app: any) => app.status === 'REJECTED').length,
            pending: applications.filter((app: any) => app.status === 'PENDING').length
          };
          
          console.log('📈 Statistiques calculées:', stats);
          setApplicationStats(stats);
        } catch (error: any) {
          console.error('❌ Erreur lors de la récupération des statistiques:', error);
          console.error('❌ Détails de l\'erreur:', error.response?.data);
          setApplicationStats(null);
        } finally {
          setLoading(false);
        }
      };

      fetchApplicationStats();
    }
  }, [isOpen, comedian?._id, token]);

  // Récupérer les absences du humoriste
  useEffect(() => {
    if (isOpen && comedian?._id && token) {
      setLoadingAbsences(true);
      const fetchAbsences = async () => {
        try {
          console.log('🔍 Récupération des absences pour:', {
            comedianId: comedian._id,
            comedianName: `${comedian.firstName} ${comedian.lastName}`
          });

          const response = await api.get(`/absences/comedian/${comedian._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('📊 Absences reçues:', response.data);
          setAbsences(response.data);
        } catch (error: any) {
          console.error('❌ Erreur lors de la récupération des absences:', error);
          console.error('❌ Détails de l\'erreur:', error.response?.data);
          setAbsences([]);
        } finally {
          setLoadingAbsences(false);
        }
      };

      fetchAbsences();
    }
  }, [isOpen, comedian?._id, token]);

  if (!comedian) return null;

  const sectionTitleStyle: CSSProperties = {
    fontSize: '1.3em',
    color: '#ff416c',
    marginTop: '20px',
    marginBottom: '15px',
    borderBottom: '2px solid #ff416c',
    paddingBottom: '8px',
    fontWeight: 'bold'
  };

  const infoRowStyle: CSSProperties = {
    display: 'flex',
    marginBottom: '12px',
    alignItems: 'flex-start'
  };

  const infoLabelStyle: CSSProperties = {
    fontWeight: 'bold',
    color: '#ff4b2b',
    minWidth: '140px',
    marginRight: '15px'
  };

  const infoValueStyle: CSSProperties = {
    color: '#ffffff',
    flex: 1,
    wordBreak: 'break-word'
  };

  const badgeStyle: CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '15px',
    backgroundColor: '#28a745',
    color: '#ffffff',
    fontSize: '0.9em',
    fontWeight: 'bold',
    marginTop: '5px'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil Humoriste">
      <div>
        <h2 style={{ fontSize: '2em', color: '#ff4b2b', marginBottom: '10px', textAlign: 'center' }}>
          {comedian.firstName} {comedian.lastName}
        </h2>
        
        {/* Informations personnelles */}
        <h3 style={sectionTitleStyle}>📋 Informations personnelles</h3>
        
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Nom complet:</span>
          <span style={infoValueStyle}>{comedian.firstName} {comedian.lastName}</span>
        </div>
        
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Email:</span>
          <span style={infoValueStyle}>{comedian.email}</span>
        </div>
        
        {comedian.phone && (
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Téléphone:</span>
            <span style={infoValueStyle}>{comedian.phone}</span>
          </div>
        )}
        
        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Statut:</span>
          <span style={badgeStyle}>Humoriste vérifié</span>
        </div>

        {/* Profil Humoriste */}
        {comedian.profile && (
          <>
            <h3 style={sectionTitleStyle}>🎭 Profil Humoriste</h3>
            
            {comedian.profile.bio && (
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Biographie:</span>
                <span style={infoValueStyle}>{comedian.profile.bio}</span>
              </div>
            )}
            
            {comedian.profile.experience !== undefined && (
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Expérience:</span>
                <span style={infoValueStyle}>
                  {comedian.profile.experience} {comedian.profile.experience === 1 ? 'an' : 'ans'} sur scène
                </span>
              </div>
            )}
            
            {comedian.profile.speciality && (
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Spécialité:</span>
                <span style={infoValueStyle}>{comedian.profile.speciality}</span>
              </div>
            )}
            
            
            {/* Informations additionnelles si disponibles */}
            {comedian.phone && (
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Téléphone (profil):</span>
                <span style={infoValueStyle}>{comedian.phone}</span>
              </div>
            )}
            
            {comedian.city && (
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Ville:</span>
                <span style={infoValueStyle}>{comedian.city}</span>
              </div>
            )}
            
            {comedian.address && (
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Adresse:</span>
                <span style={infoValueStyle}>{comedian.address}</span>
              </div>
            )}
          </>
        )}
        
        {/* Statistiques du humoriste */}
        {comedian.stats && (
          <>
            <h3 style={sectionTitleStyle}>📊 Statistiques de performance</h3>
            
            {/* Section Candidatures */}
                         <div style={{ 
               backgroundColor: 'rgba(255, 255, 255, 0.05)', 
               padding: '15px', 
               borderRadius: '8px', 
               marginBottom: '15px',
               border: '1px solid rgba(255, 255, 255, 0.1)'
             }}>
               <h4 style={{ color: '#ff416c', marginBottom: '10px', fontSize: '1.1em' }}>🎯 Candidatures</h4>
               
               {loading && (
                 <div style={{ textAlign: 'center', color: '#aaa', padding: '10px' }}>
                   Chargement des statistiques...
                 </div>
               )}
               
               {!loading && applicationStats && (
                 <>
                   <div style={infoRowStyle}>
                     <span style={infoLabelStyle}>📤 Envoyées:</span>
                     <span style={infoValueStyle}>{applicationStats.total}</span>
                   </div>
                   
                   <div style={infoRowStyle}>
                     <span style={infoLabelStyle}>✅ Acceptées:</span>
                     <span style={{ ...infoValueStyle, color: '#28a745', fontWeight: 'bold' }}>
                       {applicationStats.accepted}
                     </span>
                   </div>
                   
                   <div style={infoRowStyle}>
                     <span style={infoLabelStyle}>❌ Refusées:</span>
                     <span style={{ ...infoValueStyle, color: '#dc3545', fontWeight: 'bold' }}>
                       {applicationStats.rejected}
                     </span>
                   </div>
                   
                   <div style={infoRowStyle}>
                     <span style={infoLabelStyle}>⏳ En attente:</span>
                     <span style={{ ...infoValueStyle, color: '#ffc107', fontWeight: 'bold' }}>
                       {applicationStats.pending}
                     </span>
                   </div>
                   
                   {/* Taux de réussite */}
                   {applicationStats.total > 0 && (
                     <div style={infoRowStyle}>
                       <span style={infoLabelStyle}>📈 Taux de réussite:</span>
                       <span style={{ ...infoValueStyle, color: '#17a2b8', fontWeight: 'bold' }}>
                         {Math.round((applicationStats.accepted / applicationStats.total) * 100)}%
                       </span>
                     </div>
                   )}
                 </>
               )}
               
               {!loading && !applicationStats && (
                 <div style={{ textAlign: 'center', color: '#ffc107', padding: '10px' }}>
                   ⚠️ Impossible de charger les statistiques des candidatures
                 </div>
               )}
               
               {/* Fallback avec les anciennes données si l'API échoue */}
               {!loading && !applicationStats && comedian.stats?.applicationsSent !== undefined && (
                 <>
                   <div style={infoRowStyle}>
                     <span style={infoLabelStyle}>📤 Envoyées (approx.):</span>
                     <span style={infoValueStyle}>{comedian.stats.applicationsSent}</span>
                   </div>
                   
                   {comedian.stats.applicationsAccepted !== undefined && (
                     <div style={infoRowStyle}>
                       <span style={infoLabelStyle}>✅ Acceptées (approx.):</span>
                       <span style={{ ...infoValueStyle, color: '#28a745', fontWeight: 'bold' }}>
                         {comedian.stats.applicationsAccepted}
                       </span>
                     </div>
                   )}
                 </>
               )}
             </div>
            
            {/* Section Événements */}
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{ color: '#ff416c', marginBottom: '10px', fontSize: '1.1em' }}>🎭 Événements</h4>
              
              {comedian.stats.totalEvents !== undefined && (
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>🎪 Participations:</span>
                  <span style={{ ...infoValueStyle, color: '#28a745', fontWeight: 'bold' }}>
                    {comedian.stats.totalEvents || 0} événement{comedian.stats.totalEvents > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>🚫 Absences:</span>
                <span style={{ ...infoValueStyle, color: '#dc3545', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {comedian.stats?.absences || 0} événement{(comedian.stats?.absences || 0) > 1 ? 's' : ''}
                  {absences.length > 0 && absences[0].reason && (
                    <span
                      title={`Dernière raison d'absence : ${absences[0].reason}`}
                      style={{
                        marginLeft: 6,
                        cursor: 'pointer',
                        color: '#ffc107',
                        fontWeight: 'bold',
                        fontSize: '1.1em'
                      }}
                    >
                      +
                    </span>
                  )}
                </span>
              </div>

              {/* Détails des absences avec messages */}
              {loadingAbsences ? (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '10px', fontSize: '12px' }}>
                  Chargement des détails des absences...
                </div>
              ) : absences.length > 0 ? (
                <div style={{ 
                  marginTop: '15px',
                  padding: '10px',
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(220, 53, 69, 0.3)'
                }}>
                  <h5 style={{ 
                    color: '#dc3545', 
                    fontSize: '0.9em', 
                    marginBottom: '8px',
                    fontWeight: 'bold'
                  }}>
                    📋 Détails des absences:
                  </h5>
                  {absences.map((absence) => (
                    <div key={absence._id} style={{
                      marginBottom: '10px',
                      padding: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                      borderLeft: '3px solid #dc3545'
                    }}>
                      <div style={{ fontSize: '0.85em', color: '#ff6b6b', marginBottom: '4px' }}>
                        <strong>Événement:</strong> {absence.event.title}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#aaa', marginBottom: '4px' }}>
                        <strong>Date:</strong> {new Date(absence.event.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#aaa', marginBottom: '4px' }}>
                        <strong>Lieu:</strong> {(() => {
                          const location = absence.event.location;
                          if (typeof location === 'object' && location !== null) {
                            const locationObj = location as any;
                            const venue = locationObj.venue || '';
                            const address = locationObj.address || '';
                            const city = locationObj.city || '';
                            return `${venue}${venue && address ? ', ' : ''}${address}${(venue || address) && city ? ', ' : ''}${city}`.trim();
                          }
                          return location || 'Lieu non spécifié';
                        })()}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#aaa', marginBottom: '4px' }}>
                        <strong>Marqué par:</strong> {absence.organizer.firstName} {absence.organizer.lastName}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#aaa', marginBottom: '4px' }}>
                        <strong>Date du marquage:</strong> {new Date(absence.markedAt).toLocaleDateString('fr-FR')}
                      </div>
                      {absence.reason && (
                        <div style={{
                          marginTop: '6px',
                          padding: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          <div style={{ fontSize: '0.8em', color: '#ffc107', marginBottom: '2px', fontWeight: 'bold' }}>
                            💬 Raison de l'absence:
                          </div>
                          <div style={{ fontSize: '0.8em', color: '#ffffff', fontStyle: 'italic' }}>
                            "{absence.reason}"
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : comedian.stats?.absences && comedian.stats.absences > 0 ? (
                null
              ) : null}
              
              {comedian.stats.averageRating !== undefined && (
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>⭐ Note moyenne:</span>
                  <span style={{ ...infoValueStyle, color: '#ffc107', fontWeight: 'bold' }}>
                    {comedian.stats.averageRating}/5 ⭐
                  </span>
                </div>
              )}
              
              {/* Taux de participation */}
              {(comedian.stats.totalEvents !== undefined || comedian.stats?.absences !== undefined) && (
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>📊 Taux de participation:</span>
                  <span style={{ ...infoValueStyle, color: '#17a2b8', fontWeight: 'bold' }}>
                    {(() => {
                      const participations = comedian.stats.totalEvents || 0;
                      const absences = comedian.stats?.absences || 0;
                      const total = participations + absences;
                      return total > 0 ? Math.round((participations / total) * 100) : 100;
                    })()}%
                  </span>
                </div>
              )}
            </div>
            
            {/* Autres statistiques */}
            {comedian.stats.viralScore !== undefined && (
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>🚀 Score viral:</span>
                <span style={{ ...infoValueStyle, color: '#e83e8c', fontWeight: 'bold' }}>
                  {comedian.stats.viralScore}
                </span>
              </div>
            )}
          </>
        )}
        
        {/* Message s'il n'y a pas de profil */}
        {!comedian.profile && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: 'rgba(255, 193, 7, 0.1)', 
            borderRadius: '8px', 
            border: '1px solid #ffc107',
            marginTop: '20px'
          }}>
            <p style={{ color: '#ffc107', margin: 0, textAlign: 'center' }}>
              ⚠️ Ce humoriste n'a pas encore complété son profil professionnel.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ComedianDetailsModal;
