import React, { useEffect, useRef } from "react";
import { deleteDocument } from "../../../utils/dataFetcher";

export default function DocumentOptionsModal({closeModal, position, documentId, onDelete }) {
  const modalRef = useRef(null);

  useEffect(() => {
    // closes modal when clicked outside of modal
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeModal]);

  const handleDelete = async () => {
    try {
      const data = await deleteDocument(documentId);
      if(data == null){
        console.error("Failed to delete document");
        closeModal();
        return;
      }
      onDelete(documentId);
      closeModal();
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  // calculate position styles
  const positionStyle = position
    ? {
        position: "absolute",
        top: `${position.bottom}px`,
        left: `${position.left}px`,
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
        <button>Rename</button>
        <button onClick={() => handleDelete()}>Remove</button>
        <button>Open In New Tab</button>
      </div>
    </div>
  );
}
