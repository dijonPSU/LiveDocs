import React, { useState, useEffect } from "react";
import {
  shareDocument,
  getCollaborators,
  updateCollaboratorRole,
} from "../../../utils/dataFetcher";
import { useWS } from "../../../context/WebsocketContext";
import { useUser } from "../../../hooks/useUser";
import { dataActionEnum, documentRolesEnum } from "../../../utils/constants";
import "./ShareDocumentModal.css";

export default function ShareDocumentModal({ closeModal, documentId }) {
  const [email, setEmail] = useState("");
  const [globalUserEmail, setGlobalUserEmail] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const { user } = useUser();
  const { sendMessage } = useWS();

  useEffect(() => {
    async function fetchCollaborators() {
      try {
        const users = await getCollaborators(documentId);
        setCollaborators(users);
        setGlobalUserEmail(user.email);
      } catch (err) {
        console.error("Failed to load collaborators", err);
      }
    }

    fetchCollaborators();
  }, [documentId, user.email]);

  const handleShareDocument = async (documentId, email) => {
    try {
      const response = await shareDocument(documentId, email);
      if (response && response.userId && response.documentTitle) {
        sendMessage({
          action: dataActionEnum.NOTIFICATION,
          userId: response.userId,
          message: `${user.email} shared a document "${response.documentTitle}" with you.`,
          documentId,
        });
        setEmail("");
        // refetch collaborators
        const users = await getCollaborators(documentId);
        setCollaborators(users);
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

  const handleRoleChange = async (e, collaboratorId) => {
    const newRole = e.target.value;
    try {
      await updateCollaboratorRole(documentId, collaboratorId, newRole);
      setCollaborators((collaborators) =>
        collaborators.map((c) =>
          c.user.id === collaboratorId ? { ...c, role: newRole } : c,
        ),
      );
    } catch {
      // TODO: Change to toast
      alert("Failed to update role");
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

          {/* Collaborators */}
          <div className="collaborators-list">
            <h4>Current Collaborators</h4>
            {collaborators.length === 0 && (
              <p>Add a collaborator to see the list</p>
            )}
            <ul>
              {collaborators.map((data) => {
                return (
                  <li key={data.user.id} className="collaborator-item">
                    <img
                      src={data.user.image}
                      alt={data.user.email}
                      className="collaborator-avatar"
                    />
                    {data.user.email}{" "}
                    {data.user.email === globalUserEmail && "(You)"}
                    <select
                      value={data.role}
                      disabled={data.user.email === globalUserEmail}
                      onChange={(e) => handleRoleChange(e, data.user.id)}
                    >
                      <option value={documentRolesEnum.EDITOR}>Editor</option>
                      <option value={documentRolesEnum.VIEWER}>Viewer</option>
                      <option value={documentRolesEnum.ADMIN}>Admin</option>
                    </select>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="document-buttons">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleShareDocument(documentId, email)}
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
