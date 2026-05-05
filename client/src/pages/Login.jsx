const Login = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#1a202c' }}>Revue</h1>
      <p style={{ fontSize: '14px', color: '#718096' }}>
        AI-powered code review for your GitHub pull requests.
      </p>
      <a href={`${import.meta.env.VITE_API_URL}/api/auth/github`}>
        <button style={{ padding: '10px 24px', background: '#24292e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
          Login with GitHub
        </button>
      </a>
    </div>
  );
  
  export default Login;