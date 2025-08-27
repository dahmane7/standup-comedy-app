import React, { useState, useEffect, type CSSProperties } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { IEvent } from '../types/event';

interface ApplyToEventFormProps {
  event: IEvent;
  onClose: () => void;
  onApplicationSubmitted: () => void;
}

function ApplyToEventForm({ event, onClose, onApplicationSubmitted }: ApplyToEventFormProps) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);

  const comedianId = user?._id;

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!comedianId || !event._id) {
        setCheckingApplication(false);
        return;
      }
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await api.get<{ hasApplied: boolean }>(`/applications/check/${event._id}/${comedianId}`, config);
        setHasApplied(response.data.hasApplied);
      } catch (error) {
        console.error('Erreur lors de la vérification de candidature:', error);
      } finally {
        setCheckingApplication(false);
      }
    };
    checkExistingApplication();
  }, [event._id, comedianId, token]);

  const applyMutation = useMutation({
    mutationFn: async (applicationData: { eventId: string; comedianId: string; message?: string }) => {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await api.post('/applications', applicationData, config);
      return response.data;
    },
    onSuccess: () => {
      alert('Candidature soumise avec succès !');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      onApplicationSubmitted();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erreur lors de la soumission de la candidature:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Échec de la soumission de la candidature.';
      alert(errorMessage);

      if (errorMessage.includes('already applied') || errorMessage.includes('E11000')) {
        setHasApplied(true);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) {
      alert("ID utilisateur non disponible. Veuillez vous reconnecter.");
      return;
    }

    if (hasApplied) {
      alert('Vous avez déjà postulé à cet événement !');
      return;
    }

    applyMutation.mutate({
      eventId: event._id,
      comedianId: user._id,
      message,
    });
  };

  const formContainerStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  };

  const formContentStyle: CSSProperties = {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '480px',
    width: '100%',
    margin: '0 16px',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    position: 'relative',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  };

  const titleStyle: CSSProperties = {
    fontSize: '1.5em',
    fontWeight: '600',
    color: '#ff416c',
  };

  const closeButtonStyle: CSSProperties = {
    color: '#ccc',
    fontSize: '1.5em',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: '0.875em',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#ccc',
  };

  const textareaStyle: CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2c2c4d',
    borderRadius: '8px',
    border: '1px solid #444',
    color: '#ffffff',
    outline: 'none',
    resize: 'vertical',
    minHeight: '100px',
    fontSize: '1em',
  };

  const buttonGroupStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  };

  const baseButtonStyle: CSSProperties = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  const cancelButtonDynamicStyle: CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: applyMutation.isPending ? '#6c757d' : '#6c757d',
    color: 'white',
    opacity: applyMutation.isPending ? 0.7 : 1,
    cursor: applyMutation.isPending ? 'not-allowed' : 'pointer',
  };

  const submitButtonDynamicStyle: CSSProperties = {
    ...baseButtonStyle,
    background: hasApplied || applyMutation.isPending ? '#6c757d' : 'linear-gradient(to right, #ff416c, #ff4b2b)',
    color: 'white',
    cursor: hasApplied || applyMutation.isPending ? 'not-allowed' : 'pointer',
    opacity: hasApplied || applyMutation.isPending ? 0.7 : 1,
  };

  if (checkingApplication) {
    return (
      <div style={formContainerStyle}>
        <div style={formContentStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ border: '4px solid rgba(255, 255, 255, 0.3)', borderTop: '4px solid #ff416c', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ marginLeft: '10px', color: '#ccc' }}>Vérification...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  if (hasApplied) {
    return (
      <div style={formContainerStyle}>
        <div style={formContentStyle}>
          <div style={headerStyle}>
            <h3 style={titleStyle}>Candidature déjà envoyée</h3>
            <button
              onClick={onClose}
              style={closeButtonStyle}
            >
              ✕
            </button>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#ccc', marginBottom: '8px' }}>
              Vous avez déjà postulé à l'événement: <strong style={{ color: '#ff4b2b' }}>{event.title}</strong>
            </p>
            <p style={{ color: '#aaa', fontSize: '0.875em' }}>
              Vous ne pouvez postuler qu'une seule fois par événement.
            </p>
          </div>

          <div style={buttonGroupStyle}>
            <button
              onClick={onClose}
              style={cancelButtonDynamicStyle}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={formContainerStyle}>
      <div style={formContentStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Postuler à l'événement: {event.title}</h3>
          <button
            onClick={onClose}
            style={closeButtonStyle}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>
              Message à l'organisateur (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              style={textareaStyle}
              placeholder="Présentez-vous brièvement et expliquez pourquoi vous souhaitez participer à cet événement..."
            />
          </div>

          <div style={buttonGroupStyle}>
            <button
              type="button"
              onClick={onClose}
              style={cancelButtonDynamicStyle}
              disabled={applyMutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={submitButtonDynamicStyle}
              disabled={hasApplied || applyMutation.isPending}
            >
              {applyMutation.isPending ? 'Envoi...' : 'Envoyer ma candidature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyToEventForm; 