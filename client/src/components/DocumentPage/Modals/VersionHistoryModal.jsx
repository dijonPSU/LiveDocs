import { useEffect, useState, useRef } from "react";
import Delta from "quill-delta";
import {
  getVersions,
  savePatch,
  getVersionContent,
} from "../../../utils/dataFetcher";
import { useUser } from "../../../hooks/useUser";
import useWebSocket from "../../../hooks/useWebsocket";
import { dataActionEnum } from "../../../utils/constants";
import "./VersionHistoryModal.css";

export default function VersionHistoryModal({ documentID, onClose, quillRef }) {
  const { user } = useUser();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReverting, setIsReverting] = useState(false); // Added this
  const [previewVersion, setPreviewVersion] = useState(null);
  const [error, setError] = useState(null);
  const [currentVersionNumber, setCurrentVersionNumber] = useState(null);
  const { sendMessage } = useWebSocket(() => {}, user);
  const carouselRef = useRef();

  const scrollByItem = (dir) => {
    const track = carouselRef.current;
    if (!track) return;
    const card = track.querySelector(".carousel-item");
    if (!card) return;
    track.scrollBy({ left: dir * (card.offsetWidth + 12), behavior: "smooth" });
  };

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
      } catch (err) {
        console.error("Error fetching versions:", err);
        setError("Failed to load version history.");
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
          previewVersion.versionNumber
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
    setIsReverting(true);
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
            action: dataActionEnum.SEND,
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
      setError("Failed to restore this version. Please try again.");
    } finally {
      setIsReverting(false);
    }
  }

  // Format the date in a more readable way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (now - date < 7 * 24 * 60 * 60 * 1000) {
      return `${date.toLocaleDateString([], { weekday: 'long' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
        ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

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

          {/* --- CAROUSEL UI --- */}
          {!loading && !error && versions.length > 0 && (
            <div className="version-carousel">
              <button
                className="carousel-arrow"
                onClick={() => scrollByItem(-1)}
                aria-label="Scroll left"
                disabled={isReverting}
              >
                &#8592;
              </button>
              <div className="carousel-track" ref={carouselRef}>
                {versions.map((version) => (
                  <div
                    key={version.versionNumber}
                    className={[
                      "carousel-item",
                      previewVersion?.versionNumber === version.versionNumber && "active",
                      version.versionNumber === currentVersionNumber && "current",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="version-number">
                      <b>Version #{version.versionNumber}</b>
                      {version.versionNumber === currentVersionNumber && (
                        <span className="current-version-label">(Current)</span>
                      )}
                    </div>
                    <div className="carousel-meta">
                      {formatDate(version.createdAt)}
                    </div>
                    <div className="carousel-actions">
                      <button
                        className="btn-preview"
                        onClick={() => setPreviewVersion(version)}
                        disabled={
                          previewVersion?.versionNumber === version.versionNumber || isReverting
                        }
                      >
                        {previewVersion?.versionNumber === version.versionNumber
                          ? "Previewing"
                          : "Preview"}
                      </button>
                      <button
                        className="revert-button"
                        onClick={() => handleRevert(version.versionNumber)}
                        disabled={isReverting}
                      >
                        {isReverting ? "Loading..." : "Load"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="carousel-arrow"
                onClick={() => scrollByItem(1)}
                aria-label="Scroll right"
                disabled={isReverting}
              >
                &#8594;
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {previewVersion && (
            <button
              className="btn-secondary"
              onClick={() => setPreviewVersion(null)}
              disabled={isReverting}
            >
              Clear Preview
            </button>
          )}
          <button className="btn-secondary" onClick={onClose} disabled={isReverting}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
