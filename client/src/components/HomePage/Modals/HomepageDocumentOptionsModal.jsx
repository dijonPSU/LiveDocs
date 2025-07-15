import React, { useEffect, useRef, useState } from "react";
import { deleteDocument } from "../../../utils/dataFetcher";

export default function DocumentOptionsModal({
  closeModal,
  position,
  documentId,
  onDelete,
}) {
  const modalRef = useRef(null);
  const [deleteError, setDeleteError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setIsDeleting(true);
      const data = await deleteDocument(documentId);
      if (!data) {
        setDeleteError(true);
        setTimeout(() => setDeleteError(false), 1000);
        return;
      }
      onDelete(documentId);
      closeModal();
    } catch {
      setDeleteError(true);
      setTimeout(() => setDeleteError(false), 1000);
    } finally {
      setIsDeleting(false);
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
        <button onClick={handleDelete}>
          {deleteError
            ? "Cannot Delete"
            : isDeleting
              ? "Deleting..."
              : "Remove"}
        </button>

        <button>Open In New Tab</button>
      </div>
    </div>
  );
}
