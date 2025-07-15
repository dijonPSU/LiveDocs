import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/CallbackPage.css";

function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "true") {
      setTimeout(() => navigate("/Homepage"), 2200);
    } else if (params.has("error")) {
      setError(params.get("error"));
    }
  }, [navigate]);

  if (error) {
    return (
      <div className="callback-page">
        <h1>Authentication Error</h1>
        <p>Error: {error}</p>
        <button onClick={() => navigate("/")}>Return to Login</button>
      </div>
    );
  }

  return (
    <div className="callback-page">
      <div className="loading-box">
        <h2>Authenticating...</h2>
        <div className="spinner" />
        <p>Redirecting to your documents...</p>
      </div>
    </div>
  );
}

export default CallbackPage;
