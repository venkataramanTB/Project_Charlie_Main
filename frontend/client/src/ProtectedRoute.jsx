import React from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // Use Outlet for nested routes if needed, or just children

const ProtectedRoute = ({ children }) => {
    
    const user = sessionStorage.getItem('user');

    if (!user) {
        return <Navigate to="/Login" replace />;
    }
    return children;
};

export default ProtectedRoute;