import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, BookOpen, Lock, Mail
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (!result.success) {
        setError(result.message);
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-branding">
          <div className="login-logo">
            <BookOpen size={40} />
            <span>BMU</span>
          </div>
          <h1>Course File Management System</h1>
          <p>BML Munjal University</p>
          <div className="login-features">
            <div className="login-feature">
              <div className="feature-dot"></div>
              <span>Streamlined 25-section course file preparation</span>
            </div>
            <div className="login-feature">
              <div className="feature-dot"></div>
              <span>Faculty document submission & tracking</span>
            </div>
            <div className="login-feature">
              <div className="feature-dot"></div>
              <span>Coordinator review & compilation workflow</span>
            </div>
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2>Sign In</h2>
          <p className="login-subtitle">Enter your BMU credentials to continue</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="your.name@bmu.edu.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="demo-accounts">
            <p className="demo-title">Demo Accounts</p>
            <div className="demo-grid">
              <button className="demo-btn" onClick={() => { setEmail('admin@bmu.edu.in'); setPassword('admin123'); }}>
                <span className="demo-role">Admin</span>
                <span className="demo-email">admin@bmu.edu.in</span>
              </button>
              <button className="demo-btn" onClick={() => { setEmail('priya.sharma@bmu.edu.in'); setPassword('faculty123'); }}>
                <span className="demo-role">Faculty</span>
                <span className="demo-email">priya.sharma@bmu.edu.in</span>
              </button>
              <button className="demo-btn" onClick={() => { setEmail('neha.gupta@bmu.edu.in'); setPassword('coord123'); }}>
                <span className="demo-role">Coordinator</span>
                <span className="demo-email">neha.gupta@bmu.edu.in</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
