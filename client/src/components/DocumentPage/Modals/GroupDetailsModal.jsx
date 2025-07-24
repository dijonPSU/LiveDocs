import {
  addGroupMember,
  removeGroupMember,
  getGroupById,
} from "../../../utils/dataFetcher";
import { useUser } from "../../../hooks/useUser";
import { useState, useEffect } from "react";
import "./styles/GroupDetailsModal.css";

export default function GroupDetailsModal({ group, onClose, onGroupUpdated }) {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState(group.members || []);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    setMembers(group.members || []);
  }, [group]);

  const refreshMembers = async () => {
    const updatedGroup = await getGroupById(group.id);
    setMembers(updatedGroup.members || []);
  };

  const handleAddMember = async () => {
    setErr("");
    setAdding(true);
    try {
      await addGroupMember(group.id, email);
      await refreshMembers();
      setEmail("");
      setAdding(false);
      if (onGroupUpdated) onGroupUpdated();
    } catch {
      setErr("Failed to add member.");
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setRemoving(memberId);
    try {
      await removeGroupMember(group.id, memberId);
      await refreshMembers();
      if (onGroupUpdated) onGroupUpdated();
    } catch {
      setErr("Failed to remove member.");
    }
    setRemoving(null);
  };

  const isOwner = group.ownerId === user.id;

  return (
    <div className="modal-overlay active">
      <div className="modal-content group-details-modal">
        <div className="modal-header">
          <h3 className="modal-title">{group.name}</h3>
        </div>
        <div className="modal-body">
          <div className="group-info">
            <p>
              <strong>Default Role:</strong> {group.defaultRole}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(group.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {isOwner && (
            <div className="add-member-section">
              <h4>Add Member</h4>
              <div className="add-member-form">
                <input
                  type="email"
                  placeholder="Enter member's email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddMember}
                  disabled={!email || adding}
                  style={{ marginLeft: 8 }}
                >
                  {adding ? "Adding..." : "Add"}
                </button>
              </div>
              {err && <div className="error-message">{err}</div>}
            </div>
          )}
          <div className="members-section">
            <h4>Members ({members.length})</h4>
            <div className="members-list">
              {members.length === 0 ? (
                <p className="no-members">No members in this group yet</p>
              ) : (
                members.map((member) => (
                  <div key={member.id || member.email} className="member-item">
                    <div className="member-info">
                      <img
                        src={member.image || "/default-avatar.png"}
                        alt={member.email}
                        className="member-avatar"
                      />
                      <div className="member-details">
                        <span className="member-email">{member.email}</span>
                        {member.id === group.ownerId && (
                          <span className="owner-badge">Owner</span>
                        )}
                      </div>
                    </div>
                    {isOwner && member.id !== group.ownerId && (
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removing === member.id}
                      >
                        {removing === member.id ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
