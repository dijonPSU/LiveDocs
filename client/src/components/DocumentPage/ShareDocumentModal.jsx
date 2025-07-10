import React, { useState } from "react";
import { shareDocument } from "../../utils/dataFetcher";
import "./ShareDocumentModal.css";

export default function ShareDocumentModal({ closeModal, documentId }) {
  const [email, setEmail] = useState("");

  const handleShareDocument = async (documentId, email) => {
    try {
      const message = await shareDocument(documentId, email);
      console.log(message);
      if (message.message === "Added collaborator") {
        closeModal();
      } else {
        const form = document.getElementById("user-search");
        form.style.borderColor = "red";
      }
    } catch {
      const form = document.getElementById("user-search");
      form.style.borderColor = "red";
      form.placeholder = "Invalid email address";
    }
  };

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
                handleShareDocument(documentId, email);
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
