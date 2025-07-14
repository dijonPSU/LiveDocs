import { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "../hooks/useUser";
import { useLocation, useNavigate } from "react-router-dom";
import Quill from "quill";
import useWebSocket from "../hooks/useWebsocket";
import ShareDocumentModal from "../components/DocumentPage/ShareDocumentModal";
import "quill/dist/quill.snow.css";
import "../pages/styles/DocumentPage.css";
import {
  getDocumentContent,
  getCollaboratorsProfiles,
  savePatch,
} from "../utils/dataFetcher";

const dataActionEum = {
  JOIN: "join",
  LEAVE: "leave",
  SEND: "send",
  CLIENTLIST: "clientList",
};

export default function DocumentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { state } = location;
  const { documentName = "Untitled Document", documentId } = state || {};
  const { user, loading } = useUser();
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorProfiles, setCollaboratorProfiles] = useState([]);
  const [saveStatus, setSaveStatus] = useState("All changes saved");

  const [documentTitle, setDocumentTitle] = useState(documentName);
  const [showShareModal, setShowShareModal] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const saveTimerRef = useRef(null);
  const composedDeltaRef = useRef(null);

  // added callback for WebSocket messages to avoid effect re-run
  const handleSocketMessage = useCallback(
    (data) => {
      switch (data.action) {
        case dataActionEum.SEND:
          if (quillRef.current) {
            quillRef.current.updateContents(data.message);
          }
          break;

        case dataActionEum.CLIENTLIST:
          console.log("Raw WebSocket clients:", data.clients);
          setCollaborators(data.clients);
          getCollaboratorsProfiles(data.clients).then((profiles) =>
            setCollaboratorProfiles(
              profiles.filter((profile) => profile.id !== user.id),
            ),
          );

          break;
        default:
          break;
      }
    },
    [user?.id],
  );

  useEffect(() => {}, [collaboratorProfiles]);

  useEffect(() => {
    const mirror = document.getElementById("title-mirror");
    const input = document.getElementById("title-input");

    if (mirror && input) {
      input.style.width = `${mirror.offsetWidth}px`;
    }
  }, [documentTitle]);

  const { sendMessage, connected } = useWebSocket(handleSocketMessage, user);

  // join room on connect (MIGHT CHANGE IT SO CLIENT ONLY JOIN ROOM IF DOCUMENT IS SHARED WITH OTHERS)
  useEffect(() => {
    if (!connected || !documentId) return;

    sendMessage({ action: dataActionEum.JOIN, roomName: documentId });
    console.log("Joined room:", documentId);

    return () => {
      sendMessage({ action: dataActionEum.LEAVE, roomName: documentId });
      console.log("Left room:", documentId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, documentId]);

  //  quill editor { For now until we have a custom text editor }
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const quillOptions = {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ align: [] }],
            ["link", "image"],
            ["clean"],
          ],
        },
      };
      quillRef.current = new Quill(editorRef.current, quillOptions);

      quillRef.current.on("text-change", async (delta, _oldDelta, source) => {
        if (source !== "user" || !documentId || !user?.id) return;

        sendMessage({
          action: dataActionEum.SEND,
          roomName: documentId,
          message: delta,
        });

        setSaveStatus("Saving...");

        // compose deltas so we don't only send the latest one
        if (composedDeltaRef.current) {
          composedDeltaRef.current = composedDeltaRef.current.compose(delta);
        } else {
          composedDeltaRef.current = delta;
        }

        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(async () => {
          try {
            await savePatch(documentId, composedDeltaRef.current.ops, user.id);
            composedDeltaRef.current = null;
            setSaveStatus("All changes saved");
          } catch (error) {
            console.error("Failed to save patch:", error);
            setSaveStatus("Failed to save");
          }
        }, 3000);
      });
    }
  }, [connected, documentId, sendMessage, user?.id]);

  // get document content
  useEffect(() => {
    const loadContent = async () => {
      if (!quillRef.current || !documentId) return;

      const content = await getDocumentContent(documentId);
      if (!content) return;

      const { snapshot, patches } = content;
      if (snapshot) quillRef.current.setContents(snapshot);
      if (patches?.length) {
        patches.forEach((patch) => quillRef.current.updateContents(patch.diff));
      }
    };
    loadContent();
  }, [documentId]);

  const handleTitleChange = (e) => setDocumentTitle(e.target.value);

  const closeShareModal = () => setShowShareModal(false);

  return (
    <div className="document-page">
      <div className="document-header">
        <div className="document-left-section">
          <div className="document-logo">LiveDocs</div>
          <div className="save-status">
            {saveStatus === "Saving..." && (
              <span className="saving">
                <span className="spinner" /> {saveStatus}
              </span>
            )}
            {saveStatus === "All changes saved" && (
              <span className="saved">{saveStatus}</span>
            )}
            {saveStatus === "Failed to save" && (
              <span className="error">{saveStatus}</span>
            )}
          </div>
        </div>

        <div className="document-title-container">
          <div className="document-title-wrapper">
            <span className="document-title-mirror" id="title-mirror">
              {documentTitle || "Untitled document"}
            </span>
            <input
              type="text"
              className="document-title-input"
              value={documentTitle}
              onChange={handleTitleChange}
              placeholder="Untitled document"
              id="title-input"
            />
          </div>
        </div>

        <div className="document-actions">
          <button
            className="document-button back-to-homepage-button"
            onClick={() => navigate("/Homepage")}
          >
            Back To Homepage
          </button>
          <button className="document-button version-history-button">
            Versions
          </button>
          <button
            className="document-button share-button"
            onClick={() => setShowShareModal(true)}
          >
            Share
          </button>
          <div className="user-avatar">
            {loading ? (
              "loading"
            ) : user?.image ? (
              <img src={user.image} alt="User Avatar" />
            ) : (
              "No Avatar"
            )}
          </div>
          {collaborators.length > 0 && (
            <div className="collaborators">
              {collaboratorProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="collaborator"
                  data-email={profile.email || "Unknown User"}
                >
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.email || "Collaborator"}
                    />
                  ) : (
                    <div className="no-avatar">
                      {profile.email
                        ? profile.email.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div className="document-content">
        <div className="editor-container">
          <div ref={editorRef}></div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareDocumentModal
          closeModal={closeShareModal}
          documentId={documentId}
        />
      )}
    </div>
  );
}
