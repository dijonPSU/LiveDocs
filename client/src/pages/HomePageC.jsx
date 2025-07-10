import React from "react";
import Header from "../components/HomePage/Header/HomepageHeader.jsx";
import HomepageBody from "../components/HomePage/Body/HomepageBody.jsx";
import "../pages/styles/Homepage.css";

const HomePage = () => {
  return (
    <div className="homepage">
      <Header />
      <HomepageBody />
    </div>
  );
};

export default HomePage;
