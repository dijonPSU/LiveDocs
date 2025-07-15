import { useEffect, useState } from "react";
import {
  getVersions,
  revertToVersion,
  savePatch,
} from "../../utils/dataFetcher"; // We'll add these
import { useUser } from "../../hooks/useUser";
import useWebSocket from "../../hooks/useWebsocket";
import "./VersionHistoryModal.css";

const dataActionEum = {
  JOIN: "join",
  LEAVE: "leave",
  SEND: "send",
  CLIENTLIST: "clientList",
};

export default function VersionHistoryModal({ documentID, onClose, quillRef }) {
  const { user } = useUser();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(null);
  const [error, setError] = useState(null);
  const { sendMessage } = useWebSocket(() => {}, user);

  // Fetch versions
  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      setError(null);
      try {
        const data = await getVersions(documentID);
        setVersions(data);
      } catch {
        setError("Failed to load versions.");
      } finally {
        setLoading(false);
      }
    }
    fetchVersions();
  }, [documentID]);

  // When previewVersion changes, load it into the editor (without saving)
  useEffect(() => {
    if (!previewVersion || !quillRef.current) return;
    quillRef.current.setContents(previewVersion.diff);
  }, [previewVersion, quillRef]);

  // Revert handler
  async function handleRevert(versionNumber) {
    try {
      console.log("Reverting to version", versionNumber);
      const response = await revertToVersion(
        documentID,
        versionNumber,
        user.id,
      );
      console.log("Revert response", response);

      if (response && response.updatedContent) {
        // Clear editor before applying revert patch
        quillRef.current.setContents([response.updatedContent]);

        // Save the patch with the reverted content from empty state
        quillRef.current.setContents(response.updatedContent);

        sendMessage({
          action: dataActionEum.SEND,
          roomName: documentID,
          message: response.updatedContent,
        });
        console.log("Broadcasted revert message");

        // Close modal
        onClose();
      }
    } catch (err) {
      console.error("Revert error:", err);
      alert("Failed to revert version");
    }
  }

  return (
    <div className="modal-overlay active">
      <div className="modal-content version-history-modal">
        <div className="modal-header">
          <h2 className="modal-title">Version History</h2>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading versions...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-message">{error}</p>
            </div>
          )}

          {!loading && !error && versions.length === 0 && (
            <div className="empty-state">
              <p>No version history available for this document.</p>
            </div>
          )}

          {!loading && !error && versions.length > 0 && (
            <div className="version-list">
              {versions.map((version) => (
                <div
                  key={version.versionNumber}
                  className={`version-item ${
                    previewVersion?.versionNumber === version.versionNumber
                      ? "active"
                      : ""
                  }`}
                >
                  <div className="version-info">
                    <div className="version-number">
                      Version #{version.versionNumber}
                    </div>
                    <div className="version-meta">
                      {new Date(version.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="version-actions">
                    <button
                      className="btn-preview"
                      onClick={() => setPreviewVersion(version)}
                      disabled={
                        previewVersion?.versionNumber === version.versionNumber
                      }
                    >
                      {previewVersion?.versionNumber === version.versionNumber
                        ? "Previewing"
                        : "Preview"}
                    </button>
                    <button
                      className="revert-button"
                      onClick={() => handleRevert(version.versionNumber)}
                    >
                      Revert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {previewVersion && (
            <button
              className="btn-secondary"
              onClick={() => setPreviewVersion(null)}
            >
              Clear Preview
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
