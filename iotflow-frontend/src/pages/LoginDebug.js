import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginDebug = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('🔍 DEBUG: Form submitted, preventDefault called');

    setLoading(true);
    setResult(null);

    try {
      console.log('🔍 DEBUG: Calling login function');
      const loginResult = await login(email, password);
      console.log('🔍 DEBUG: Login result:', loginResult);
      setResult(loginResult);
    } catch (error) {
      console.error('🔍 DEBUG: Error caught:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
      console.log('🔍 DEBUG: Login process completed');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Login Debug Page</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="text"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
          }}
        >
          <h4>Result:</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Test with invalid credentials to see error handling:</p>
        <ul>
          <li>Email: invalid@test.com</li>
          <li>Password: wrongpassword</li>
        </ul>
        <p>Check browser console for detailed logs.</p>
      </div>
    </div>
  );
};

export default LoginDebug;
