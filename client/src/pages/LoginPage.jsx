import React from 'react';
import OAuthSignIn from '../components/OAuth';
import './loginPage.css';
import titleLogo from '../assets/titleLogo.webp';

const LoginPage = () => {
    return (
        <div className="login-page">
            <div className="login-content">
                <img src={titleLogo} alt="LiveDocs Logo" className="login-logo" />
                <h1 className="login-title">Welcome to LiveDocs</h1>
                <p className="login-subtitle">Collaborate on documents in real-time</p>

                <div className="login-container">
                    <OAuthSignIn />
                </div>

                <div className="login-footer">
                    <p>By signing in, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
