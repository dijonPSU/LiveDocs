import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import useWebSocket from "../hooks/useWebsocket";
import useQuillEditor from "../hooks/useQuill";
import useDebouncedSave from "../hooks/useAutosave";

import { saveStatusEnum, dataActionEum } from "../utils/constants";

import ShareDocumentModal from "../components/DocumentPage/Modals/ShareDocumentModal";
import VersionHistoryModal from "../components/DocumentPage/Modals/VersionHistoryModal";
import DocumentHeader from "../components/DocumentPage/Header/DocumentpageHeader";
import ActiveCollaborators from "../components/DocumentPage/Header/ActiveCollaborators";

import {
  getDocumentContent,
  getCollaboratorsProfiles,
  savePatch,
  updateDocumentTitle,
} from "../utils/dataFetcher";

import "quill/dist/quill.snow.css";
import "../pages/styles/DocumentPage.css";

export default function DocumentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { state } = location;
  const { documentName = "Untitled Document", documentId } = state || {};
  const { user, loading } = useUser();

  const [documentTitle, setDocumentTitle] = useState(documentName);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(saveStatusEnum.SAVED);
  const [collaboratorProfiles, setCollaboratorProfiles] = useState([]);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const queueSave = useDebouncedSave(
    (delta) => savePatch(documentId, delta.ops, user.id, quillRef),
    () => setSaveStatus(saveStatusEnum.SAVED),
    () => setSaveStatus(saveStatusEnum.ERROR),
  );

  const handleTextChange = (delta, _oldDelta, source) => {
    if (source !== "user" || !documentId || !user?.id) return;

    sendMessage({
      action: dataActionEum.SEND,
      roomName: documentId,
      message: delta,
    });

    setSaveStatus(saveStatusEnum.SAVING);
    queueSave(delta);
  };

  useQuillEditor(editorRef, quillRef, handleTextChange);

  const handleSocketMessage = useCallback((data) => {
    switch (data.action) {
      case dataActionEum.SEND:
        if (quillRef.current) {
          if (data.reset) {
            quillRef.current.setContents(data.message);
          } else {
            quillRef.current.updateContents(data.message);
          }
        }
        break;

      case dataActionEum.CLIENTLIST:
        getCollaboratorsProfiles(data.clients).then((profiles) =>
          setCollaboratorProfiles(
            profiles.filter((profile) => profile.id !== user?.id),
          ),
        );
        break;

      default:
        break;
    }
  }, []);

  const { sendMessage, connected } = useWebSocket(handleSocketMessage);

  useEffect(() => {
    if (connected && user?.id) {
      sendMessage({ action: "identify", userId: user.id });
    }
  }, [connected, user?.id, sendMessage]);

  useEffect(() => {
    if (!connected || !documentId) return;
    sendMessage({ action: dataActionEum.JOIN, roomName: documentId });
    return () =>
      sendMessage({ action: dataActionEum.LEAVE, roomName: documentId });
  }, [connected, documentId, sendMessage]);

    // Load initial document content
  useEffect(() => {
    const loadContent = async () => {
      if (!quillRef.current || !documentId) return;

      const content = await getDocumentContent(documentId);
      if (!content) return;

      const { snapshot, patches } = content;

      quillRef.current.setContents([]);
      if (snapshot) {
        quillRef.current.setContents(snapshot);
      }

      if (patches?.length) {
        patches.forEach((patch) => {
          quillRef.current.updateContents(patch.diff);
        });
      }
    };
    loadContent();
  }, [documentId]);

    // resize title input to match mirror span
  useEffect(() => {
    const mirror = document.getElementById("title-mirror");
    const input = document.getElementById("title-input");

    if (mirror && input) {
      input.style.width = `${mirror.offsetWidth}px`;
    }
  }, [documentTitle]);

  const handleTitleChange = async (e) => {
    if (e.key === "Enter") {
      try {
        await updateDocumentTitle(documentId, documentTitle);
        e.target.blur();
      } catch {
        console.log("Failed to update document title");
      }
    }
  };

  return (
    <div className="document-page">
      <DocumentHeader
        documentTitle={documentTitle}
        setDocumentTitle={setDocumentTitle}
        handleTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        navigate={navigate}
        openShareModal={() => setShowShareModal(true)}
        openVersionModal={() => setShowVersionHistoryModal(true)}
        user={user}
        loading={loading}
        collaboratorProfiles={
          <ActiveCollaborators profiles={collaboratorProfiles} />
        }
      />

      {/* Document Content */}
      <div className="document-content">
        <div className="editor-container">
          <div ref={editorRef}></div>
        </div>
      </div>

      {/* Modals */}
      {showShareModal && (
        <ShareDocumentModal
          closeModal={() => setShowShareModal(false)}
          documentId={documentId}
        />
      )}
      {showVersionHistoryModal && (
        <VersionHistoryModal
          documentID={documentId}
          onClose={() => setShowVersionHistoryModal(false)}
          quillRef={quillRef}
        />
      )}
    </div>
  );
}
