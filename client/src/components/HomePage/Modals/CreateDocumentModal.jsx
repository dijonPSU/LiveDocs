import React from "react";
import { useNavigate } from "react-router";
import { createDocument } from "../../../utils/dataFetcher";
import "./CreateDocumentModal.css";

export default function CreateDocumentModal({ closeModal }) {
  const navigate = useNavigate();

  const handleCreateDocument = (title) => {
    if (title === "") {
      const inputBar = document.getElementById("document-name");
      inputBar.placeholder = "Please enter a valid document name";
      inputBar.style.borderColor = "red";
      return;
    } else {
      createDocument(title);
      navigate("/DocumentPage", {
        state: { documentName: document.getElementById("document-name").value },
      });
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Create Document</h2>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="document-name">Document Name</label>
            <input
              type="text"
              className="form-control"
              id="document-name"
              placeholder="Enter document name"
              required
            />
          </div>
          <div className="document-buttons">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const title = document.getElementById("document-name").value;
                handleCreateDocument(title);
              }}
            >
              Create
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              data-dismiss="modal"
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
