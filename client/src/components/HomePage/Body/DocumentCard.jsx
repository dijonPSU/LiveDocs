import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const DocumentCard = ({ doc, onEditClick }) => {
  const navigate = useNavigate();

  const handleDocumentCardClick = () => {
    navigate("/DocumentPage", {
      state: { documentId: doc.id, documentName: doc.title },
    });
  };

  return (
    <div
      className="document-card"
      key={doc.id}
      onClick={handleDocumentCardClick}
    >
      <div className="document-preview">
        <div className="preview-content">
          <div className="preview-line"></div>
          <div className="preview-line short"></div>
          <div className="preview-line medium"></div>
        </div>
      </div>
      <div className="document-info">
        <p className="document-title">{doc.title}</p>
        <p className="document-date">
          Last Edited:{" "}
          {formatDistanceToNow(new Date(doc.updatedAt), {
            addSuffix: true,
          })}
        </p>
        <div className="document-edit">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(e);
            }}
            className="document-button"
          >
            <strong>EDIT</strong>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
