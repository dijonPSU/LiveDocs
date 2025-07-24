import { useEffect, useState, useRef } from "react";
import Delta from "quill-delta";
import {
  getVersions,
  revertToVersion,
} from "../../../utils/dataFetcher";
import { useUser } from "../../../hooks/useUser";
import useWebSocket from "../../../hooks/useWebsocket";
import { dataActionEnum } from "../../../utils/constants";
import "./styles/VersionHistoryModal.css";

export default function VersionHistoryModal({ documentID, onClose, quillRef, onStartPreview }) {
  const { user } = useUser();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [error, setError] = useState(null);
  const [currentVersionNumber, setCurrentVersionNumber] = useState(null);
  const { sendMessage } = useWebSocket(() => { }, user);
  const carouselRef = useRef();

  // Fetch versions
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
      } catch (error) {
        // TODO: Toast error
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchVersions();
  }, [documentID]);


  async function handleRevert(versionNumber) {
    setIsReverting(true);
    try {
      const result = await revertToVersion(documentID, versionNumber, user.id);

      if (result && result.updatedContent && quillRef.current) {
        // Update the editor with the reverted content
        quillRef.current.setContents(new Delta(result.updatedContent));

        // Broadcast the reverted content to other users
        try {
          sendMessage({
            action: dataActionEnum.SEND,
            roomName: documentID,
            message: new Delta(result.updatedContent),
            reset: true,
          });
        } catch (error) {
          // TODO: Toast error
          console.error("Failed to broadcast revert:", error);
        }

        setCurrentVersionNumber(versionNumber);
        onClose();
      }
    } catch (error) {
      // TODO: Toast error
      console.error("Failed to revert version:", error);
    } finally {
      setIsReverting(false);
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (now - date < 7 * 24 * 60 * 60 * 1000) {
      return `${date.toLocaleDateString([], { weekday: "long" })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return (
        date.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        ` at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      );
    }
  };

  // Carousel fade logic
  const [showFadeLeft, setShowFadeLeft] = useState(false);
  const [showFadeRight, setShowFadeRight] = useState(false);

  useEffect(() => {
    const track = carouselRef.current;
    if (!track) return;

    const handleScroll = () => {
      setShowFadeLeft(track.scrollLeft > 0);
      setShowFadeRight(track.scrollLeft + track.offsetWidth < track.scrollWidth - 1);
    };
    handleScroll();
    track.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [versions.length, loading]);

  const activeDotIdx = -1; // no active preview in modal since preview happens outside

  return (
    <div className="modal-overlay active">
      <div className="modal-content version-history-modal custom-wide-modal">
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
            <>
              <div className="version-carousel" style={{ position: "relative", width: "100%" }}>
                {showFadeLeft && <div className="carousel-fade-left"></div>}
                <div className="carousel-track no-arrows" ref={carouselRef}>
                  {versions.map((version) => (
                    <div
                      key={version.versionNumber}
                      className={[
                        "carousel-item",
                        version.versionNumber === currentVersionNumber && "current",
                      ].filter(Boolean).join(" ")}
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
                          onClick={() => onStartPreview(version)}
                          disabled={isReverting}
                        >
                          Preview
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
                {showFadeRight && <div className="carousel-fade-right"></div>}
              </div>
              <div className="carousel-progress">
                {versions.map((_, idx) => (
                  <span
                    key={idx}
                    className={"carousel-dot" + (activeDotIdx === idx ? " active" : "")}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn-secondary sharp"
            onClick={onClose}
            disabled={isReverting}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
