import "./styleHeader.css";
import { useState } from "react";
import HomepageProfileModal from "./HomepageProfileModal";

const Header = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalPosition, setProfileModalPosition] = useState(null);

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
            <input className="search-input" placeholder="Search" />
          </div>
          <div className="header-buttons">
            <button
             className="header-profile"
             onClick={() => setIsProfileModalOpen(true)}
             >
            DM
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
