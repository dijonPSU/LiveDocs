import { useEffect, useState } from "react";
import Delta from "quill-delta";
import {
  getVersions,
  savePatch,
  getVersionContent,
} from "../../../utils/dataFetcher";
import { useUser } from "../../../hooks/useUser";
import useWebSocket from "../../../hooks/useWebsocket";
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
  const [currentVersionNumber, setCurrentVersionNumber] = useState(null);
  const { sendMessage } = useWebSocket(() => {}, user);

  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      setError(null);
      try {
        const data = await getVersions(documentID);
        setVersions(data);
        if (data && data.length > 0) {
          setCurrentVersionNumber(data[0].versionNumber);
        }
      } catch {
        setError("Failed to load versions.");
      } finally {
        setLoading(false);
      }
    }
    fetchVersions();
  }, [documentID]);

  useEffect(() => {
    async function previewVersionContent() {
      if (!previewVersion || !quillRef.current) return;
      try {
        const content = await getVersionContent(
          documentID,
          previewVersion.versionNumber,
        );
        if (content) {
          quillRef.current.setContents(new Delta(content));
        }
      } catch (err) {
        console.error("Failed to preview version", err);
      }
    }
    previewVersionContent();
  }, [previewVersion, documentID, quillRef, user.id]);

  async function handleRevert(versionNumber) {
    try {
      const content = await getVersionContent(documentID, versionNumber);
      if (content && quillRef.current) {
        quillRef.current.setContents(new Delta(content));
        const currentLength = quillRef.current.getLength();
        const delta = new Delta()
          .retain(0)
          .delete(currentLength - 1)
          .concat(new Delta(content));
        await savePatch(documentID, delta, user.id, quillRef);
        try {
          sendMessage({
            action: dataActionEum.SEND,
            roomName: documentID,
            message: content,
            reset: true,
          });
        } catch (error) {
          console.error("Failed to broadcast revert via WebSocket:", error);
        }
        setCurrentVersionNumber(versionNumber);
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
                  } ${
                    version.versionNumber === currentVersionNumber
                      ? "current"
                      : ""
                  }`}
                >
                  <div className="version-info">
                    <div className="version-number">
                      Version #{version.versionNumber}
                      {version.versionNumber === currentVersionNumber && (
                        <span className="current-version-label">(Current)</span>
                      )}
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
                      Load
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
