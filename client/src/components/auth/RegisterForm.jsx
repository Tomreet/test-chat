// RegisterForm.jsx
import React, { useState } from 'react';
import MyButton from '../UI/MyButton';
import { Eye, EyeClosed } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const RegisterForm = ({ onRegister, switchToLogin, loadUsers, saveUsers }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const users = await loadUsers();
      
      const existingUser = users.find(u => 
        u.name.toLowerCase() === formData.name.trim().toLowerCase()
      );

      if (existingUser) {
        setError('Username already taken');
        return;
      }

      const newUser = {
        id: uuidv4(),
        name: formData.name.trim(),
        password: formData.password,
        avatar: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIwLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdXNlciI+PHBhdGggZD0iTTE5IDIxdi0yYTQgNCAwIDAgMC00LTRIOWE0IDQgMCAwIDAtNCA0djIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiLz48L3N2Zz4=",
        createdAt: new Date().toISOString(),
        isAdmin: false
      };

      await saveUsers([...users, newUser]);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      onRegister(newUser);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="MyBackground">
      <div className="auth-container">
        <form onSubmit={handleSubmit}>
          <h2>Create Account</h2>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({...prev, name: e.target.value}));
                setError('');
              }}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group password-input">
            <input
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => {
                setFormData(prev => ({...prev, password: e.target.value}));
                setError('');
              }}
              required
              disabled={isLoading}
            />
            <MyButton
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              icon={showPassword ? <EyeClosed /> : <Eye />}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <input
              placeholder="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData(prev => ({...prev, confirmPassword: e.target.value}));
                setError('');
              }}
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
          
          <button
            type="button"
            onClick={switchToLogin}
            disabled={isLoading}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
