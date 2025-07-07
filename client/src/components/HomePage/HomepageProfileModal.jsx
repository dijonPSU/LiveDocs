import React, { useEffect, useRef } from "react";

export default function HomepageProfileModal({ closeModal, position}) {
  const modalRef = useRef(null);

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
        position: "absolute",
        top: position.y + 3,
        left: position.x,
        zIndex: 1000,
      }
    : {};

  return (
    <div
      ref={modalRef}
      className="document-options-dropdown"
      style={positionStyle}
    >
      <div className="edit-options-modal-content">
        <button>Profile Image</button>
        <button>Logout</button>
      </div>
    </div>
  );
}
