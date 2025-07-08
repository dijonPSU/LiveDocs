import React, { useEffect, useRef } from "react";
import "./profileModal.css";
import { userLogout } from "../../../utils/authControl";
import { useNavigate } from "react-router";

export default function HomepageProfileModal({ closeModal, position }) {
  const modalRef = useRef(null);
  const Navigate = useNavigate();

  // mock data for styling
  const userData = {
    name: "Dijon Miller",
    email: "dijon.miller@example.com",
    initials: "DM",
    profileImage:
      "https://img.freepik.com/free-photo/portrait-expressive-young-man-wearing-formal-suit_273609-6942.jpg?semt=ais_hybrid&w=740",
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
