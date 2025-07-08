import React, { useEffect, useRef } from "react";
import "./profileModal.css";
import { userLogout } from "../../../utils/authControl";
import { useNavigate } from "react-router";
import { useUser } from "../../../hooks/useUser";

export default function HomepageProfileModal({ closeModal, position }) {
  const modalRef = useRef(null);
  const Navigate = useNavigate();
  const { user } = useUser();

  const userData = {
    email: user.email,
    profileImage: user.image,
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

  const handleLogout = async () => {
    try {
      await userLogout();
      Navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div ref={modalRef} className="profile-modal" style={positionStyle}>
      <div className="profile-modal-content">
        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-avatar">
            <img
              src={userData.profileImage}
              alt="Profile"
              className="profile-image"
            />
          </div>
          <div className="profile-info">
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
