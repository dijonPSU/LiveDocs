import React from 'react';
import Header from '../components/Header/HomepageHeader.jsx';
import HomepageBody from '../components/Body/HomepageBody.jsx';
import './Homepage.css';

const Homepage = () => {
    return (
        <div className="homepage">
            <Header />
            <HomepageBody />
        </div>
    );
};

export default Homepage;
