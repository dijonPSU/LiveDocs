import "./styleHeader.css";
import { useState } from "react";
import HomepageProfileModal from "../Modals/HomepageProfileModal";
import { useUser } from "../../../hooks/useUser";
import { useSearch } from "../../../context/SearchContext";

const Header = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalPosition, setProfileModalPosition] = useState(null);
  const { searchQuery, setSearchQuery } = useSearch();
  const { user } = useUser();

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    const buttonRect = e.target.getBoundingClientRect();
    setProfileModalPosition({
      top: buttonRect.top + buttonRect.height,
      left: buttonRect.left,
    });
    setIsProfileModalOpen(true);
  };

  return (
    <>
      <div className="Top-Header">
        <div className="logo-container">
          <h1>LiveDocs</h1>
        </div>
        <div className="header-actions">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="header-buttons">
            <button
              className="header-profile"
              onClick={(event) => handleProfileClick(event)}
            >
              <img src={user?.image} alt="profile" />
            </button>
          </div>
        </div>
      </div>
      {isProfileModalOpen && (
        <HomepageProfileModal
          closeModal={closeProfileModal}
          position={profileModalPosition}
        />
      )}
    </>
  );
};

export default Header;
