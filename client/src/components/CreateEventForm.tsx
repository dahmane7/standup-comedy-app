import React, { type CSSProperties, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
// import { useIsMobile } from '../hooks/use-mobile';
import { X } from 'lucide-react';

interface CreateEventFormProps {
  onClose: () => void;
  onEventCreated: () => void;
}

function CreateEventForm({ onClose, onEventCreated }: CreateEventFormProps) {
  const { user, token } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    postalCode: '',
    address: '',
    country: '',
    date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD par défaut
    venue: '',
    startTime: '',
    endTime: '',
    minExperience: '',
    maxComedians: '',
    status: 'PUBLISHED',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
    if (!formData.description.trim()) newErrors.description = 'La description est requise';
    if (!formData.city.trim()) newErrors.city = 'La ville est requise';
    
    // Validation spécifique pour la date
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    } else {
      // Vérifier que la date est au format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date)) {
        newErrors.date = 'Format de date invalide. Utilisez le sélecteur de date.';
      } else {
        const selectedDate = new Date(formData.date);
        if (isNaN(selectedDate.getTime())) {
          newErrors.date = 'Date invalide';
        }
      }
    }
    
    if (!formData.venue.trim()) newErrors.venue = 'Le lieu est requis';
    if (!formData.startTime) newErrors.startTime = 'L\'heure de début est requise';
    if (!formData.endTime) newErrors.endTime = 'L\'heure de fin est requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      alert("Vous devez être connecté pour créer un événement.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔍 [DEBUG] Données du formulaire:', formData);
      
      // Date and time parsing - formData.date is already in YYYY-MM-DD format from input type="date"
      const eventDate = new Date(formData.date);
      console.log('📅 Date parsée:', eventDate);

      // Calculate duration in minutes
      const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const startMinutes = parseTime(formData.startTime);
      const endMinutes = parseTime(formData.endTime);
      const duration = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes;

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date, // format YYYY-MM-DD
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: {
          venue: formData.venue, // venue dans location
          city: formData.city,
          postalCode: formData.postalCode,
          address: formData.address,
          country: formData.country || 'France'
        },
        requirements: {
          minExperience: formData.minExperience ? parseInt(formData.minExperience) : 0,
          maxPerformers: formData.maxComedians ? parseInt(formData.maxComedians) : undefined,
          duration // duration dans requirements
        },
        status: formData.status
      };
      
      console.log('📤 Données envoyées au serveur:', eventData);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/events`, eventData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
        onEventCreated();
        onClose();
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'événement:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création de l\'événement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Styles adaptatifs
  const modalStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: isMobile ? '0' : '20px',
    overflow: 'auto'
  };

  const formStyle: CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: isMobile ? '0' : '16px',
    width: isMobile ? '100%' : '600px',
    maxWidth: isMobile ? '100%' : '90vw',
    height: isMobile ? '100vh' : 'auto',
    maxHeight: isMobile ? '100vh' : '90vh',
    overflow: 'auto',
    border: isMobile ? 'none' : '1px solid #333',
    boxShadow: isMobile ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.5)'
  };

  const headerStyle: CSSProperties = {
    padding: isMobile ? '20px 16px 16px' : '24px',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: isMobile ? 'sticky' : 'static',
    top: 0,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    zIndex: 1
  };

  const contentStyle: CSSProperties = {
    padding: isMobile ? '16px' : '24px',
    color: '#fff'
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: isMobile ? '14px 16px' : '12px 16px',
    fontSize: isMobile ? '16px' : '14px', // 16px prevents zoom on iOS
    border: '1px solid #444',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    marginBottom: '4px'
  };

  const buttonStyle: CSSProperties = {
    padding: isMobile ? '16px 24px' : '12px 24px',
    fontSize: isMobile ? '16px' : '14px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: isMobile ? '100%' : 'auto'
  };

  return (
    <div style={modalStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={formStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ 
            margin: 0, 
            color: '#fff', 
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '700'
          }}>
            Créer un nouvel événement
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#fff',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '16px' : '20px'
            }}>
              {/* Titre */}
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.title ? '#ef4444' : '#444'
                  }}
                  placeholder="Ex: Soirée Stand-Up Comedy"
                />
                {errors.title && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={isMobile ? 3 : 4}
                  style={{
                    ...inputStyle,
                    borderColor: errors.description ? '#ef4444' : '#444',
                    resize: 'vertical',
                    minHeight: isMobile ? '80px' : '100px'
                  }}
                  placeholder="Décrivez votre événement..."
                />
                {errors.description && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Lieu */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Lieu/Bar *
                </label>
                <input
                  type="text"
                  id="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.venue ? '#ef4444' : '#444'
                  }}
                  placeholder="Ex: Le Comedy Club"
                />
                {errors.venue && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                    {errors.venue}
                  </p>
                )}
              </div>

              {/* Ville */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Ville *
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.city ? '#ef4444' : '#444'
                  }}
                  placeholder="Ex: Paris"
                />
                {errors.city && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                    {errors.city}
                  </p>
                )}
              </div>

              {/* Code postal */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Code postal
                </label>
                <input
                  type="text"
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Ex: 75001"
                />
              </div>

              {/* Adresse */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Adresse
                </label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Ex: 123 rue de la Comédie"
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.date ? '#ef4444' : '#444'
                  }}
                  required
                  min={new Date().toISOString().split('T')[0]} // Empêcher les dates passées
                />
                {errors.date && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Heure de début */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Heure de début *
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.startTime ? '#ef4444' : '#444'
                  }}
                />
                {errors.startTime && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                    {errors.startTime}
                  </p>
                )}
              </div>

              {/* Heure de fin */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Heure de fin *
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: errors.endTime ? '#ef4444' : '#444'
                  }}
                />
                {errors.endTime && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>
                    {errors.endTime}
                  </p>
                )}
              </div>

              {/* Expérience minimale */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Expérience minimale (années)
                </label>
                <input
                  type="number"
                  id="minExperience"
                  value={formData.minExperience}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Ex: 6"
                  min="0"
                />
              </div>

              {/* Nombre maximum d'humoristes */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#ccc' }}>
                  Nombre max d'humoristes
                </label>
                <input
                  type="number"
                  id="maxComedians"
                  value={formData.maxComedians}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Ex: 5"
                  min="1"
                />
              </div>
            </div>

            {/* Boutons */}
            <div style={{ 
              marginTop: '32px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  ...buttonStyle,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  order: isMobile ? 2 : 1
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...buttonStyle,
                  background: isSubmitting ? '#666' : 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                  color: '#fff',
                  order: isMobile ? 1 : 2,
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Création...' : 'Créer l\'événement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateEventForm; 