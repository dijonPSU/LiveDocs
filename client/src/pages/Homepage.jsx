import React from 'react';
import Header from '../components/HomePage/HomepageHeader.jsx';
import HomepageBody from '../components/HomePage/HomepageBody.jsx';
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
