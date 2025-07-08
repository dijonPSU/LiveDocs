import React from "react";
import Header from "../components/Homepage/Header/HomepageHeader.jsx";
import HomepageBody from "../components/Homepage/Body/HomepageBody.jsx";
import "../pages/styles/Homepage.css";

const Homepage = () => {
  return (
    <div className="homepage">
      <Header />
      <HomepageBody />
    </div>
  );
};

export default Homepage;
