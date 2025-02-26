// AuthForm.jsx
import React, { useState } from 'react';
import MyButton from '../UI/MyButton';
import { Eye, EyeClosed } from 'lucide-react';

const AuthForm = ({ onLogin, switchToRegister, loadUsers }) => {
  const [credentials, setCredentials] = useState({ 
    name: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.name.trim() || !credentials.password.trim()) {
      setError('All fields are required');
      return;
    }

    try {
      setIsLoading(true);
      const users = await loadUsers();
      
      // Добавляем базовую валидацию
      const user = users.find(u => 
        u.name.toLowerCase() === credentials.name.trim().toLowerCase() && 
        u.password === credentials.password
      );

      if (user) {
        const userWithToken = {
          ...user,
          token: crypto.randomUUID() // Генерация временного токена
        };
        localStorage.setItem('currentUser', JSON.stringify(userWithToken));
        onLogin(userWithToken);
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Authorization error:', error);
      setError('Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="MyBackground">
      <div className="auth-container">
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={credentials.name}
              onChange={(e) => {
                setCredentials(prev => ({...prev, name: e.target.value}));
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
              value={credentials.password}
              onChange={(e) => {
                setCredentials(prev => ({...prev, password: e.target.value}));
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

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Login'}
          </button>
          
          <button
            type="button"
            onClick={switchToRegister}
            disabled={isLoading}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
