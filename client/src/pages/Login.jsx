import GitHubLogo3D from "../components/GitHubBackground.jsx";

const Login = () => (
  <>
    <style>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .login-wrap { animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both; }
      .gh-btn:hover {
        background: #000 !important;
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.28) !important;
      }
      .gh-btn:active { transform: translateY(0) !important; }
    `}</style>

 
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg, #f9fafb 0%, #f3f4f6 100%)",
      padding: "32px 16px",
    }}>
      <div
        className="login-wrap"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
   
        <GitHubLogo3D size={100} />

      
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: "44px 36px 32px",
          width: 340,
          boxShadow: "0 4px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
          textAlign: "center",
        }}>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: "#111827",
            letterSpacing: "-0.5px", margin: "16px 0 6px",
          }}>
            Revue
          </h1>
          <p style={{
            fontSize: 13.5, color: "#6b7280", lineHeight: 1.65,
            margin: "0 0 28px",
          }}>
            AI-powered code review for your<br />GitHub pull requests.
          </p>

          <a
            href={`${import.meta.env.VITE_API_URL}/api/auth/github`}
            style={{ textDecoration: "none" }}
          >
            <button
              className="gh-btn"
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "12px 20px",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                fontSize: 14, fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                transition: "background 0.18s, transform 0.14s, box-shadow 0.18s",
                letterSpacing: "0.01em",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              Continue with GitHub
            </button>
          </a>

          <p style={{ margin: "16px 0 0", fontSize: 11.5, color: "#9ca3af" }}>
            By signing in you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  </>
);

export default Login;