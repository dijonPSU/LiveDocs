import React from "react";
import Header from "../components/HomePage/Header/HomepageHeader.jsx";
import HomepageBody from "../components/HomePage/Body/HomepageBody.jsx";
import "../pages/styles/Homepage.css";
import { SearchProvider } from "../context/SearchContext.jsx";
const HomePage = () => {
  return (
    <SearchProvider>
      <div className="homepage">
        <Header />
        <HomepageBody />
      </div>
    </SearchProvider>
  );
};

export default HomePage;
