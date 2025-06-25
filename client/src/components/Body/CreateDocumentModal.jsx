import React from "react";
import "./CreateDocumentModal.css";


export default function CreateDocumentModal({ closeModal }) {
  return (
    <div className = "modal-overlay active">
        <div className="modal-content">
            <div className = "modal-header">
                <h2 className = "modal-title">Create Document</h2>
            </div>
            <div className = "modal-body">
                <div className = "form-group">
                    <label htmlFor="document-name">Document Name</label>
                    <input type="text" className="form-control" id="document-name" placeholder="Enter document name" />
                </div>
                <div className = "document-buttons">
                    <button type="button" className="btn btn-primary">Create</button>
                    <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={closeModal} >Cancel</button>
                </div>
            </div>
        </div>
    </div>
  );
}
