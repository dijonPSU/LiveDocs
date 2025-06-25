import React, { useEffect, useState } from 'react';

function CallbackPage() {
    const [token, setToken] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // get access token from URL
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        if (params.has('access_token')) {
            const accessToken = params.get('access_token');
            setToken(accessToken);

            // store token in local storage for now
            localStorage.setItem('googleAccessToken', accessToken);

            // redirect to dashboard
            // window.location.href = '/dashboard';
        } else if (params.has('error')) {
            setError(params.get('error'));
        }
    }, []);

    if (error) {
        return (
            <div className="callback-page">
                <h1>Authentication Error</h1>
                <p>Error: {error}</p>
                <button onClick={() => window.location.href = '/'}>
                    Return to Login
                </button>
            </div>
        );
    }

    if (token) {
        return (
            <div className="callback-page">
                <h1>Authentication Successful</h1>
                <p>You have successfully authenticated with Google.</p>
                <button onClick={() => window.location.href = '/'}>
                    Continue to App
                </button>
            </div>
        );
    }

    return (
        <div className="callback-page">
            <h1>Processing Authentication...</h1>
            <p>Please wait while we authenicate.</p>
        </div>
    );
}

export default CallbackPage;
