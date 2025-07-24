import React, { useState, useEffect, useCallback } from "react";
import { getUserGroups, deleteGroup } from "../utils/dataFetcher";
import { useUser } from "../hooks/useUser";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateGroupModal from "../components/DocumentPage/Modals/CreateGroupModal";
import GroupDetailsModal from "../components/DocumentPage/Modals/GroupDetailsModal";
import "./styles/GroupsManagementPage.css";

export default function GroupsManagementPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get("documentId");

  // Fetch only groups for this document
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const userGroups = await getUserGroups(documentId);
      setGroups(userGroups || []);
    } catch {
      setGroups([]);
    }
    setLoading(false);
  }, [documentId]);

  // Fetch groups
  useEffect(() => {
    if (!documentId) {
      navigate("/Homepage");
      return;
    }
    fetchGroups();
  }, [documentId, fetchGroups, navigate]);

  const handleDeleteGroup = async (groupId) => {
    setDeleting(groupId);
    try {
      await deleteGroup(groupId);
      setGroups(groups.filter((g) => g.id !== groupId));
    } catch {
      // TODO: ADD TOAST NOTI
      console.error("Failed to delete group");
    }
    setDeleting(null);
  };

  const handleViewGroup = (group) => setSelectedGroup(group);

  const handleGroupUpdated = () => fetchGroups();

  const handleCreateGroup = () => setShowCreateGroup(true);

  const getTotalMembers = () => {
    return groups.reduce((acc, group) => acc + (group.members?.length || 0), 0);
  };

  const getGroupsYouOwn = () => {
    return groups.filter((group) => group.ownerId === user.id).length;
  };

  const handleGroupCreated = () => {
    setShowCreateGroup(false);
    fetchGroups();
  };

  const handleBackToDocument = () => {
    navigate("/DocumentPage", { state: { documentId: documentId } });
  };

  if (selectedGroup) {
    return (
      <GroupDetailsModal
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onGroupUpdated={handleGroupUpdated}
      />
    );
  }

  return (
    <div className="groups-management-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">Group Management</h1>
            <p className="page-subtitle">
              Organize and manage your document collaboration groups
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="content-header">
          <div className="stats-section">
            {!loading && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{groups.length}</div>
                  <div className="stat-label">Total Groups</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{getTotalMembers()}</div>
                  <div className="stat-label">Total Members</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{getGroupsYouOwn()}</div>
                  <div className="stat-label">Groups You Own</div>
                </div>
              </div>
            )}
          </div>

          <div className="actions-section">
            <button className="back-button" onClick={handleBackToDocument}>
              ← Back to Document
            </button>
            <button
              className="btn btn-primary create-group-btn"
              onClick={handleCreateGroup}
            >
              + Create New Group
            </button>
          </div>
        </div>

        <div className="groups-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <h3>No groups yet</h3>
              <p>
                Create your first group to start organizing your collaborators
              </p>
              <button className="btn btn-primary" onClick={handleCreateGroup}>
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="groups-grid">
              {groups.map((group) => (
                <div key={group.id} className="group-card">
                  <div className="group-card-header">
                    <div className="group-info">
                      <h3 className="group-name">{group.name}</h3>
                      <div className="group-meta">
                        <span
                          className={`role-badge ${group.defaultRole.toLowerCase()}`}
                        >
                          {group.defaultRole}
                        </span>
                        <span className="member-count">
                          {group.members?.length || 0} members
                        </span>
                      </div>
                    </div>
                    {group.ownerId === user.id && (
                      <div className="owner-indicator">
                        <span className="owner-badge">Owner</span>
                      </div>
                    )}
                  </div>

                  <div className="group-card-body">
                    <div className="group-details">
                      <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">
                          {new Date(group.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      {group.members && group.members.length > 0 && (
                        <div className="members-preview">
                          <span className="detail-label">Members:</span>
                          <div className="members-avatars">
                            {group.members.slice(0, 3).map((member, index) => (
                              <img
                                key={member.id || index}
                                src={member.image || "/default-avatar.png"}
                                alt={member.email}
                                className="member-avatar-small"
                                title={member.email}
                              />
                            ))}
                            {group.members.length > 3 && (
                              <div className="more-members">
                                +{group.members.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="group-card-footer">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleViewGroup(group)}
                    >
                      View Details
                    </button>
                    {group.ownerId === user.id && (
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteGroup(group.id)}
                        disabled={deleting === group.id}
                      >
                        {deleting === group.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={handleGroupCreated}
          documentId={documentId}
        />
      )}
    </div>
  );
}
