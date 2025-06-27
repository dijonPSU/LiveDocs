import React from 'react';
import GooglePathImage from './Path Images/GooglePathImage.jsx';
import { handleSignIn } from '../utils/utils.js';

function OAuthSignIn() {
    return (
        <button onClick={handleSignIn}>
            <GooglePathImage />
            Sign in with Google
        </button>
    );
}

export default OAuthSignIn;
