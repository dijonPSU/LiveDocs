import { createContext, useContext, useEffect, useState } from 'react';
import { getUserData } from '../utils/dataFetcher.js';


const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const loadUserData = async () => {
            const userData = await getUserData();
            setUser(userData);
            setLoading(false);
        }
        loadUserData();
    }, []);

    return (
        <UserContext.Provider value={{user, loading}}>
            {children}
        </UserContext.Provider>
    );
}


export const useUser = () => useContext(UserContext);
