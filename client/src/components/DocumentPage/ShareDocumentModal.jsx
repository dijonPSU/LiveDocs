import React, { useState } from "react";
import { shareDocument } from "../../utils/dataFetcher";
import "./ShareDocumentModal.css";

export default function ShareDocumentModal({ closeModal, documentId }) {
  const [email, setEmail] = useState("");

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Share Document</h2>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="user-search">Search for users to collaborate</label>
            <input
              type="text"
              className="form-control"
              id="user-search"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="document-buttons">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // TODO: Add logic incase it fails
                shareDocument(documentId, email);
                closeModal();
              }}
            >
              Share
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
