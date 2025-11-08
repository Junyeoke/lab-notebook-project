import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const OAuth2RedirectHandler = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const auth = useAuth();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        if (token) {
            localStorage.setItem('token', token);
            // The AuthProvider will automatically pick up the token and update the user state
            // But we need to manually trigger a state update in the context
            auth.loginWithToken(token);
            navigate('/');
        } else {
            // Handle error case
            navigate('/login');
        }
    }, [location, navigate, auth]);

    return <div>Loading...</div>;
};

export default OAuth2RedirectHandler;
