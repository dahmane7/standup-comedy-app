import React, { type CSSProperties, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import type { IUserData } from '../types/user';
import Modal from './Modal';

interface EditComedianProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: IUserData;
  onSaveSuccess: () => void;
}

function EditComedianProfileForm({ isOpen, onClose, currentUser, onSaveSuccess }: EditComedianProfileFormProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<IUserData>(currentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(currentUser);
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else if (name === 'experience') {
        setFormData(prev => ({ ...prev, profile: { ...prev.profile, experience: Number(value) } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      // Send only the fields that are specific to the comedian's profile update
      const comedianProfileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        city: formData.city,
        phone: formData.phone,
        address: formData.address,
        profile: {
            bio: formData.profile?.bio,
            experience: formData.profile?.experience ? Number(formData.profile.experience) : undefined,
            speciality: formData.profile?.speciality,
        }
      };

      await axios.put(`/api/profile/${currentUser._id}`, comedianProfileData, config);
      onSaveSuccess();
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du profil:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Échec de la mise à jour du profil.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '1px solid #444',
    backgroundColor: '#333',
    color: '#fff',
  };

  const buttonStyle: CSSProperties = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
    color: 'white',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    marginRight: '10px',
  };

  const cancelButtonClass: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    backgroundImage: 'none',
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#ff4b2b',
    fontSize: '0.9em',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 style={{ color: '#ff416c', marginBottom: '20px' }}>Modifier le Profil Humoriste</h2>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Prénom *</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="Entrez votre prénom"
          style={inputStyle}
          required
        />
        
        <label style={labelStyle}>Nom *</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Entrez votre nom"
          style={inputStyle}
          required
        />
        
        <label style={labelStyle}>Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Entrez votre email"
          style={inputStyle}
          required
        />
        
        <label style={labelStyle}>Ville</label>
        <input
          type="text"
          name="city"
          value={formData.city || ''}
          onChange={handleChange}
          placeholder="Entrez votre ville"
          style={inputStyle}
        />
        
        <label style={labelStyle}>Téléphone</label>
        <input
          type="text"
          name="phone"
          value={formData.phone || ''}
          onChange={handleChange}
          placeholder="Entrez votre numéro de téléphone"
          style={inputStyle}
        />
        
        <label style={labelStyle}>Adresse</label>
        <input
          type="text"
          name="address"
          value={formData.address || ''}
          onChange={handleChange}
          placeholder="Entrez votre adresse complète"
          style={inputStyle}
        />
        
        <label style={labelStyle}>Bio</label>
        <textarea
          name="profile.bio"
          value={formData.profile?.bio || ''}
          onChange={handleChange}
          placeholder="Décrivez votre style d'humour et votre parcours..."
          rows={5}
          style={inputStyle}
        ></textarea>
        
        <label style={labelStyle}>Années d'expérience</label>
        <input
          type="number"
          name="profile.experience"
          value={formData.profile?.experience || ''}
          onChange={handleChange}
          placeholder="Nombre d'années d'expérience"
          style={inputStyle}
        />
        
        <label style={labelStyle}>Spécialité</label>
        <input
          type="text"
          name="profile.speciality"
          value={formData.profile?.speciality || ''}
          onChange={handleChange}
          placeholder="Ex: Stand-up, One-man-show, Improvisation..."
          style={inputStyle}
        />
        {error && <p style={{ color: '#dc3545', marginBottom: '15px' }}>{error}</p>}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button type="button" style={cancelButtonClass} onClick={onClose} disabled={loading}>
          Annuler
        </button>
      </form>
    </Modal>
  );
}

export default EditComedianProfileForm; 