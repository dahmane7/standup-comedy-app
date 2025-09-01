import React, { type CSSProperties, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { IEvent } from '../types/event';
import api from '../services/api';

interface EditEventFormProps {
  onClose: () => void;
  onEventUpdated: () => void;
  eventToEdit: IEvent;
}

function EditEventForm({ onClose, onEventUpdated, eventToEdit }: EditEventFormProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    address: '',
    country: '',
    date: '',
    venue: '',
    startTime: '',
    endTime: '',
    minExperience: 0,
    maxPerformers: 0,
    status: 'PUBLISHED',
  });

  useEffect(() => {
    if (eventToEdit) {
      const eventDate = new Date(eventToEdit.date);
      const formattedDate = `${eventDate.getDate().toString().padStart(2, '0')}/${(eventDate.getMonth() + 1).toString().padStart(2, '0')}/${eventDate.getFullYear()}`;
      
      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        city: eventToEdit.location.city,
        address: eventToEdit.location.address,
        country: eventToEdit.location.country,
        date: formattedDate,
        venue: eventToEdit.location.venue || '',
        startTime: eventToEdit.startTime || '',
        endTime: eventToEdit.endTime || '',
        minExperience: eventToEdit.requirements.minExperience,
        maxPerformers: eventToEdit.requirements.maxPerformers,
        status: eventToEdit.status,
      });
    }
  }, [eventToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("Vous devez être connecté pour modifier un événement.");
      return;
    }

    const [day, month, year] = formData.date.split('/').map(Number);
    const eventDate = new Date(year, month - 1, day);

    // Calculate duration in minutes
    const parseTime = (timeStr: string) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const startMinutes = parseTime(formData.startTime);
    const endMinutes = parseTime(formData.endTime);
    let durationInMinutes = 0;
    if (endMinutes >= startMinutes) {
      durationInMinutes = endMinutes - startMinutes;
    } else {
      durationInMinutes = (24 * 60 - startMinutes) + endMinutes;
    }

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: eventDate.toISOString(),
        location: {
          venue: formData.venue,
          address: formData.address,
          city: formData.city,
          country: formData.country,
        },
        requirements: {
          minExperience: Number(formData.minExperience),
          maxPerformers: Number(formData.maxPerformers),
          duration: durationInMinutes,
        },
        status: formData.status.toUpperCase(),
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      await api.put(`/events/${eventToEdit._id}`, eventData, config);
      alert('Événement mis à jour avec succès !');
      onEventUpdated();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error.response?.data || error.message);
      alert(`Erreur lors de la mise à jour de l'événement: ${error.response?.data?.message || error.message}`);
    }
  };

  const formContainerStyle: CSSProperties = {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '30px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
  };

  const formTitleStyle: CSSProperties = {
    fontSize: '2em',
    color: '#ff416c',
    marginBottom: '20px',
  };

  const inputGroupStyle: CSSProperties = {
    marginBottom: '15px',
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#ff4b2b',
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #555',
    backgroundColor: '#333',
    color: '#ffffff',
    boxSizing: 'border-box',
  };

  const textAreaStyle: CSSProperties = {
    ...inputStyle,
    minHeight: '80px',
    resize: 'vertical',
  };

  const twoColumnLayout: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px',
  };

  const buttonContainerStyle: CSSProperties = {
    marginTop: '30px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
  };

  const primaryButtonStyle: CSSProperties = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(to right, #28a745, #218838)',
    color: 'white',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  };

  const secondaryButtonStyle: CSSProperties = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(to right, #dc3545, #c82333)',
    color: 'white',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  };

  return (
    <div style={formContainerStyle}>
      <h2 style={formTitleStyle}>Modifier l'événement</h2>
      <form onSubmit={handleSubmit}>
        <div style={inputGroupStyle}>
          <label htmlFor="title" style={labelStyle}>Titre de l'événement</label>
          <input type="text" id="title" style={inputStyle} value={formData.title} onChange={handleChange} required />
        </div>

        <div style={inputGroupStyle}>
          <label htmlFor="description" style={labelStyle}>Description</label>
          <textarea id="description" style={textAreaStyle} value={formData.description} onChange={handleChange} required></textarea>
        </div>
        
        <div style={twoColumnLayout}>
          <div style={inputGroupStyle}>
            <label htmlFor="city" style={labelStyle}>Ville</label>
            <input type="text" id="city" style={inputStyle} value={formData.city} onChange={handleChange} required />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="country" style={labelStyle}>Pays</label>
            <input type="text" id="country" style={inputStyle} value={formData.country} onChange={handleChange} required />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label htmlFor="address" style={labelStyle}>Adresse</label>
          <input type="text" id="address" style={inputStyle} value={formData.address} onChange={handleChange} required />
        </div>

        <div style={twoColumnLayout}>
          <div style={inputGroupStyle}>
            <label htmlFor="date" style={labelStyle}>Date</label>
            <input type="text" id="date" style={inputStyle} placeholder="jj/mm/aaaa" value={formData.date} onChange={handleChange} required />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="venue" style={labelStyle}>Lieu (nom de la salle)</label>
            <input type="text" id="venue" style={inputStyle} value={formData.venue} onChange={handleChange} />
          </div>
        </div>

        <div style={twoColumnLayout}>
          <div style={inputGroupStyle}>
            <label htmlFor="startTime" style={labelStyle}>Heure de début</label>
            <input type="text" id="startTime" style={inputStyle} placeholder="HH:MM" value={formData.startTime} onChange={handleChange} required />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="endTime" style={labelStyle}>Heure de fin</label>
            <input type="text" id="endTime" style={inputStyle} placeholder="HH:MM" value={formData.endTime} onChange={handleChange} required />
          </div>
        </div>

        <div style={twoColumnLayout}>
          <div style={inputGroupStyle}>
            <label htmlFor="minExperience" style={labelStyle}>Expérience minimale (années)</label>
            <input type="number" id="minExperience" style={inputStyle} value={formData.minExperience} onChange={handleChange} required />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="maxPerformers" style={labelStyle}>Nombre maximum d'humoristes</label>
            <input type="number" id="maxPerformers" style={inputStyle} value={formData.maxPerformers} onChange={handleChange} required />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label htmlFor="status" style={labelStyle}>Statut</label>
          <select id="status" style={inputStyle} value={formData.status} onChange={handleChange}>
            <option value="PUBLISHED">Publié</option>
            <option value="CANCELLED">Annulé</option>
            <option value="COMPLETED">Terminé</option>
          </select>
        </div>

        <div style={buttonContainerStyle}>
          <button type="submit" style={primaryButtonStyle}>Sauvegarder</button>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>Annuler</button>
        </div>
      </form>
    </div>
  );
}

export default EditEventForm; 