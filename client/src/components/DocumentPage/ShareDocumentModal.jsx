import React from "react";
import "./ShareDocumentModal.css";

export default function ShareDocumentModal({ closeModal }) {
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
            />
          </div>
          <div className="document-buttons">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // Future functionality will be added here
                console.log("Share functionality to be implemented");
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
