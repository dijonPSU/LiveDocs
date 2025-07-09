import { useEffect, useRef, useState, useCallback } from "react";
import Quill from "quill";
import { useUser } from "../hooks/useUser";
import { useLocation, useNavigate } from "react-router-dom";
import useWebSocket from "../hooks/useWebsocket";
import ShareDocumentModal from "../components/DocumentPage/ShareDocumentModal";
import "quill/dist/quill.snow.css";
import "../pages/styles/DocumentPage.css";
import { getDocumentContent, savePatch } from "../utils/dataFetcher";

export default function DocumentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { state } = location;
  const { documentName = "Untitled Document", documentId } = state || {};
  const { user, loading } = useUser();

  const [documentTitle, setDocumentTitle] = useState(documentName);
  const [showShareModal, setShowShareModal] = useState(false);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // added callback for WebSocket messages to avoid effect re-run
  const handleSocketMessage = useCallback((data) => {
    if (data.action === "send" && quillRef.current) {
      quillRef.current.updateContents(data.message);
      console.log("Patch applied:", data.message);
    }
  }, []);

  const { sendMessage, connected } = useWebSocket(handleSocketMessage);

  // join room on connect (MIGHT CHANGE IT SO CLIENT ONLY JOIN ROOM IF DOCUMENT IS SHARED WITH OTHERS)
  useEffect(() => {
    if (!connected || !documentId) return;

    sendMessage({ action: "join", roomName: documentId });
    console.log("Joined room:", documentId);

    return () => {
      sendMessage({ action: "leave", roomName: documentId });
      console.log("Left room:", documentId);
    };
  }, [connected, documentId, sendMessage]);

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
    }
  }, []);

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

  // send user changes through webSocket and save patches
  useEffect(() => {
    if (!connected || !quillRef.current) return;

    const handleTextChange = async (delta, oldDelta, source) => {
      if (source !== "user") return;
      console.log("Sending changes to server:", delta);

      sendMessage({
        action: "send",
        message: delta,
        roomName: documentId,
      });

      try {
        await savePatch(documentId, delta, user?.id);
      } catch (error) {
        console.error("Error saving patch:", error);
      }
    };

    quillRef.current.on("text-change", handleTextChange);
    return () => {
      quillRef.current.off("text-change", handleTextChange);
    };
  }, [connected, documentId, sendMessage, user?.id]);

  const handleTitleChange = (e) => setDocumentTitle(e.target.value);

  const closeShareModal = () => setShowShareModal(false);

  return (
    <div className="document-page">
      <div className="document-header">
        <div className="document-logo">LiveDocs</div>

        <div className="document-title-container">
          <input
            type="text"
            className="document-title-input"
            value={documentTitle}
            onChange={handleTitleChange}
            placeholder="Untitled document"
          />
        </div>

        <div className="document-actions">
          <button
            className="document-button back-to-homepage-button"
            onClick={() => navigate("/Homepage")}
          >
            Back To Homepage
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
        </div>
      </div>

      {/* Document Content */}
      <div className="document-content">
        <div className="editor-container">
          <div ref={editorRef}></div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && <ShareDocumentModal closeModal={closeShareModal} />}
    </div>
  );
}
