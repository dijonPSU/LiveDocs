import { createGroup } from "../../../utils/dataFetcher";
import { documentRolesEnum } from "../../../utils/constants";
import { useState } from "react";
import "./styles/CreateGroupModal.css";

export default function CreateGroupModal({ onClose, onCreated, documentId }) {
  const [groupName, setGroupName] = useState("");
  const [defaultRole, setDefaultRole] = useState(documentRolesEnum.VIEWER);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleCreate = async () => {
    if (!groupName) {
      setErr("Please enter a group name.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await createGroup(groupName, defaultRole, documentId);
      setLoading(false);
      onCreated();
    } catch {
      setErr("Failed to create group.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content create-group-modal">
        <div className="modal-header">
          <h3 className="modal-title">Create New Group</h3>
        </div>
        <div className="modal-body">
          <div className="form-section">
            <h4>Group Name</h4>
            <div className="enhanced-form-group">
              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="enhanced-input"
                style={{ width: "95%" }}
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Default Role</h4>
            <div className="enhanced-form-group">
              <select
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                className="enhanced-select"
              >
                <option value={documentRolesEnum.VIEWER}>Viewer</option>
                <option value={documentRolesEnum.EDITOR}>Editor</option>
                <option value={documentRolesEnum.ADMIN}>Admin</option>
              </select>
              <div className="role-descriptions">
                <p className="role-desc">
                  <strong>Viewer:</strong> Can view and comment on the document
                  <br />
                  <strong>Editor:</strong> Can view, comment, and edit the
                  document
                  <br />
                  <strong>Admin:</strong> Full access including sharing and
                  managing permissions
                </p>
              </div>
            </div>
          </div>

          {err && <div className="error-message-enhanced">{err}</div>}
        </div>
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-enhanced btn-secondary-enhanced"
          >
            Cancel
          </button>
          <button
            className="btn-enhanced btn-primary-enhanced"
            disabled={loading}
            onClick={handleCreate}
            style={{ marginLeft: 8 }}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
