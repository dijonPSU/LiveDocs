import React, { useEffect, useRef } from "react";
import "./profileModal.css";

export default function HomepageProfileModal({ closeModal, position }) {
  const modalRef = useRef(null);

  // mock data for styling
  const userData = {
    name: "Dijon Miller",
    email: "dijon.miller@example.com",
    initials: "DM",
    profileImage:
      "data:image/jpeg;base64,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",
  };

  useEffect(() => {
    // closes modal when clicked outside of modal
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeModal]);

  // calculate position styles
  const positionStyle = position
    ? {
        position: "fixed",
        top: position.top + 20, // was blocking search bar. added 20px to move it down
        right: 16,
        zIndex: 1000,
      }
    : {};

  const handleLogout = () => {
    // will add logic here
    console.log("Logging out...");
    closeModal();
  };

  return (
    <div ref={modalRef} className="profile-modal" style={positionStyle}>
      <div className="profile-modal-content">
        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-avatar">
            {userData.profileImage ? (
              <img
                src={userData.profileImage}
                alt="Profile"
                className="profile-image"
              />
            ) : (
              <div className="profile-initials">{userData.initials}</div>
            )}
          </div>
          <div className="profile-info">
            <div className="profile-name">{userData.name}</div>
            <div className="profile-email">{userData.email}</div>
          </div>
        </div>

        <div className="modal-divider"></div>

        {/* Profile Actions */}
        <div className="profile-actions">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
