import { useState, type CSSProperties } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

function RegisterPage() {
  const { registerMutation } = useAuth();
  // const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'COMEDIAN' as const,
    profile: {
      bio: '',
      experience: '',
    },
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas !');
      return;
    }
    try {
      await registerMutation.mutateAsync(formData);
      // La redirection est gérée dans AuthContext
    } catch (error: any) {
      alert(error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription');
    }
  };

  const handleChangeRegister = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'bio' || name === 'experience') {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const pageStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a2e', // Couleur de fond sombre
    backgroundImage: 'linear-gradient(to bottom right, #1a1a2e, #331f41)', // Dégradé subtil
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  };

  const containerStyle: CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Fond semi-transparent pour la carte
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
    maxWidth: '500px',
    width: '90%',
  };

  const inputStyle: CSSProperties = {
    width: 'calc(100% - 20px)',
    padding: '12px 10px',
    margin: '10px 0',
    borderRadius: '8px',
    border: '1px solid #444',
    backgroundColor: '#2c2c4d',
    color: '#ffffff',
    fontSize: '1em',
    outline: 'none',
  };

  const buttonStyle: CSSProperties = {
    width: '100%',
    padding: '15px',
    margin: '20px 0',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(to right, #28a745, #218838)', // Dégradé vert
    color: 'white',
    fontSize: '1.2em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  };

  const linkStyle: CSSProperties = {
    color: '#28a745',
    textDecoration: 'none',
    fontWeight: 'bold',
    marginTop: '10px',
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h2>Inscris-toi !</h2>
        <p>Crée ton compte pour rejoindre la communauté</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChangeRegister}
            style={inputStyle}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChangeRegister}
            style={inputStyle}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirme ton mot de passe"
            value={formData.confirmPassword}
            onChange={handleChangeRegister}
            style={inputStyle}
            required
          />
          {passwordError && (
            <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.95em' }}>{passwordError}</div>
          )}
          <input
            type="text"
            name="firstName"
            placeholder="Prénom"
            value={formData.firstName}
            onChange={handleChangeRegister}
            style={inputStyle}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Nom"
            value={formData.lastName}
            onChange={handleChangeRegister}
            style={inputStyle}
            required
          />
          <textarea
            name="bio"
            placeholder="Biographie"
            value={formData.profile.bio}
            onChange={handleChangeRegister}
            style={{ ...inputStyle, minHeight: '80px' }} // Style spécifique pour textarea
            required
          ></textarea>
          <input
            type="number"
            name="experience"
            placeholder="Expérience"
            value={formData.profile.experience}
            onChange={handleChangeRegister}
            style={{ ...inputStyle, minHeight: '80px' }} // Style spécifique pour textarea
            required
          ></input>
          <select
            name="role"
            value={formData.role}
            onChange={handleChangeRegister}
            style={inputStyle}
            required
          >
            <option value="COMEDIAN">Humoriste</option>
            <option value="ORGANIZER">Organisateur</option>
          </select>
          <button type="submit" style={buttonStyle} disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Création du compte..." : "S'inscrire"}
          </button>
        </form>

        <p>Déjà un compte ? <Link to="/login" style={linkStyle}>Connecte-toi</Link></p>
      </div>
    </div>
  );
}

export default RegisterPage; 