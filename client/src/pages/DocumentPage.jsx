import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useWS } from "../context/WebsocketContext";
import useQuillEditor from "../hooks/useQuill";
import useDebouncedSave from "../hooks/useAutosave";
import Delta from "quill-delta";
import CustomDelta from "../hooks/delta";
import {
  saveStatusEnum,
  dataActionEnum,
  documentRolesEnum,
} from "../utils/constants";
import ShareDocumentModal from "../components/DocumentPage/Modals/ShareDocumentModal";
import VersionHistoryModal from "../components/DocumentPage/Modals/VersionHistoryModal";
import SummaryModal from "../components/DocumentPage/Modals/SummaryModal";
import AutocompleteDropdown from "../components/DocumentPage/AutocompleteDropdown";
import DocumentHeader from "../components/DocumentPage/Header/DocumentpageHeader";
import ActiveCollaborators from "../components/DocumentPage/Header/ActiveCollaborators";
import {
  getDocumentContent,
  getCollaboratorsProfiles,
  savePatch,
  updateDocumentTitle,
  getUserRole,
  getVersionContent,
} from "../utils/dataFetcher";
import { computeDeltaDiff } from "../hooks/deltaAlgo";
import { getColorForUser } from "../utils/helpers";

import "quill/dist/quill.snow.css";
import "../pages/styles/DocumentPage.css";

export default function DocumentPage() {
  const navigate = useNavigate();
  const { id: documentId } = useParams();
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const { user, loading } = useUser();
  const { sendMessage, addListener, connected } = useWS();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({
    left: 0,
    top: 0,
  });
  const [currentWord, setCurrentWord] = useState("");
  const [saveStatus, setSaveStatus] = useState(saveStatusEnum.SAVED);
  const [collaboratorProfiles, setCollaboratorProfiles] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [originalContent, setOriginalContent] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(null);
  const lastSavedDeltaRef = useRef(new Delta());
  const lastSelectionRef = useRef(null);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // Autosave
  const queueSave = useDebouncedSave(
    (delta) => savePatch(documentId, delta.ops, user.id, quillRef),
    () => {
      setSaveStatus(saveStatusEnum.SAVED);
      if (quillRef.current) {
        lastSavedDeltaRef.current = quillRef.current.getContents();
      }
    },
    () => setSaveStatus(saveStatusEnum.ERROR),
  );

  // Join/leave room
  useEffect(() => {
    if (!connected || !documentId) return;
    sendMessage({ action: "join", roomName: documentId });
    return () => sendMessage({ action: "leave", roomName: documentId });
  }, [connected, documentId, sendMessage]);

  // Handle WebSocket message
  useEffect(() => {
    const unsubscribe = addListener((data) => {
      switch (data.action) {
        case dataActionEnum.SEND:
          if (data.from === user?.id) return;
          if (quillRef.current) {
            if (data.reset) {
              quillRef.current.setContents(data.message);
            } else {
              quillRef.current.updateContents(data.message);
            }
            lastSavedDeltaRef.current = quillRef.current.getContents(); // relatime baseline sync
          }
          break;
        case dataActionEnum.CLIENTLIST:
          if (data.clients == null) return;
          getCollaboratorsProfiles(data.clients).then((profiles) =>
            setCollaboratorProfiles(
              profiles.filter((profile) => profile.id !== user?.id),
            ),
          );
          break;
        case dataActionEnum.CURSOR:
          if (!data.userId || data.userId === user?.id) return;
          setRemoteCursors((prev) => ({
            ...prev,
            [data.userId]: {
              range: data.range,
              userInfo: data.userInfo || {},
            },
          }));
          break;
        default:
          break;
      }
    });
    return unsubscribe;
  }, [user?.id, addListener]);

  //  Render remote cursors
  useEffect(() => {
    if (!quillRef.current || !quillRef.current.getModule) return;
    const cursors = quillRef.current.getModule("cursors");

    // Remove any stale cursors
    cursors.cursors().forEach((cursor) => {
      if (!remoteCursors[cursor.id]) {
        cursors.removeCursor(cursor.id);
      }
    });

    // Add & move all current cursors
    Object.entries(remoteCursors).forEach(([userId, { range, userInfo }]) => {
      if (!range || typeof range.index !== "number") {
        cursors.removeCursor(userId);
        return;
      }
      cursors.createCursor(
        userId,
        userInfo?.email || userId,
        getColorForUser(userId),
      );
      cursors.moveCursor(userId, range);
    });
  }, [remoteCursors, quillRef]);

  // Get cursor position for autocomplete
  const getCursorPosition = () => {
    if (!quillRef.current) return { left: 0, top: 0 };

    const selection = quillRef.current.getSelection();
    if (!selection) return { left: 0, top: 0 };

    const bounds = quillRef.current.getBounds(selection.index);
    const editorRect = editorRef.current.getBoundingClientRect();

    return {
      left: editorRect.left + bounds.left,
      top: editorRect.top + bounds.top + bounds.height + 5, // 5px below cursor
    };
  };

  // Check if we should show autocomplete and get current word
  const shouldShowAutocomplete = () => {
    if (!quillRef.current) return { show: false, word: "" };

    const selection = quillRef.current.getSelection();
    if (!selection) return { show: false, word: "" };

    const text = quillRef.current.getText();
    const cursorPos = selection.index;

    // Start at cursor position and go backwards until we find a non word character
    let wordStart = cursorPos;
    while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
      wordStart--;
    }

    const word = text.slice(wordStart, cursorPos);

    // Show autocomplete if we have at least 2 characters
    const show = word.length >= 2 && /^\w+$/.test(word);
    return { show, word };
  };

  // Text change handler
  const handleTextChange = (_delta, _oldDelta, source) => {
    if (source !== "user" || !documentId || !user?.id) return;

    const newDelta = quillRef.current.getContents();
    const baseDelta =
      lastSavedDeltaRef.current instanceof Delta
        ? lastSavedDeltaRef.current
        : new Delta(lastSavedDeltaRef.current);

    const deltaDiff = computeDeltaDiff(baseDelta, newDelta);
    if (!deltaDiff.ops || !deltaDiff.ops.length) return;

    const delta = new CustomDelta(deltaDiff);
    sendMessage({
      action: dataActionEnum.SEND,
      roomName: documentId,
      message: delta,
    });

    setSaveStatus(saveStatusEnum.SAVING);
    queueSave(delta);
    lastSavedDeltaRef.current = newDelta;

    // Handle autocomplete
    const { show, word } = shouldShowAutocomplete();
    if (show) {
      setAutocompletePosition(getCursorPosition());
      setShowAutocomplete(true);
      setCurrentWord(word);
    } else {
      setShowAutocomplete(false);
      setCurrentWord("");
    }
  };

  // Fetch and set user role
  useEffect(() => {
    const fetchAndSetRole = async () => {
      if (!documentId || !user?.id) return;
      try {
        const data = await getUserRole(documentId);
        setUserRole(data.role);
      } catch (err) {
        // TODO: Add Toast Error handlng
        console.error("Failed to load collaborators", err);
      }
    };
    fetchAndSetRole();
  }, [documentId, user?.id]);

  useQuillEditor(editorRef, quillRef, handleTextChange, userRole);

  // Broadcast cursor position
  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current;

    function broadcastSelection(range) {
      if (!range || !user?.id || !documentId) return;
      // Only broadcast if changed
      if (
        !lastSelectionRef.current ||
        range.index !== lastSelectionRef.current.index ||
        range.length !== lastSelectionRef.current.length
      ) {
        sendMessage({
          action: dataActionEnum.CURSOR,
          roomName: documentId,
          userId: user.id,
          range,
          userInfo: {
            id: user.id,
            email: user.email,
          },
        });
        lastSelectionRef.current = range;
      }
    }

    function handleSelectionChange(range, _oldRange, source) {
      if (source === "user") {
        broadcastSelection(range);
      }
    }

    function handleTextChange() {
      const range = quill.getSelection();
      if (range) {
        broadcastSelection(range);
      }
    }

    quill.on("selection-change", handleSelectionChange);
    quill.on("text-change", handleTextChange);

    return () => {
      quill.off("selection-change", handleSelectionChange);
      quill.off("text-change", handleTextChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendMessage, user?.id, documentId, quillRef]);

  // Load document content
  useEffect(() => {
    const loadContent = async () => {
      const content = await getDocumentContent(documentId);
      if (!content) return;
      const { title, snapshot, patches } = content;

      // set document title and document content
      setDocumentTitle(title || "Untitled Document");
      quillRef.current.setContents(snapshot || []);
      if (patches?.length) {
        patches.forEach((patch) => {
          quillRef.current.updateContents(patch.diff);
        });
      }
      // Set baseline to final state
      lastSavedDeltaRef.current = quillRef.current.getContents();
    };
    loadContent();
  }, [documentId]);

  // Title mirror
  useEffect(() => {
    const mirror = document.getElementById("title-mirror");
    const input = document.getElementById("title-input");
    if (mirror && input) {
      input.style.width = `${mirror.offsetWidth}px`;
    }
  }, [documentTitle]);

  // Title change handler
  const handleTitleChange = async (e) => {
    if (e.key === "Enter") {
      try {
        await updateDocumentTitle(documentId, documentTitle);
        e.target.blur(); // gets rid of focus
      } catch {
        console.error("Failed to update document title");
      }
    }
  };

  const handleShareModal = () => {
    if (
      userRole === documentRolesEnum.VIEWER ||
      userRole === documentRolesEnum.EDITOR
    ) {
      return;
    }

    setShowShareModal(true);
  };

  const handlerVersionHistoryModal = () => {
    if (userRole === documentRolesEnum.VIEWER) {
      return;
    }
    setShowVersionHistoryModal(true);
  };

  const handleSummaryModal = () => {
    setShowSummaryModal(true);
  };

  const handleAutocompleteSelect = (suggestion) => {
    if (!quillRef.current || !documentId || !user?.id) return;

    const selection = quillRef.current.getSelection();
    if (!selection) return;

    const text = quillRef.current.getText();
    const cursorPos = selection.index;

    if (!currentWord || currentWord.length === 0) {
      const insertDelta = new Delta().retain(cursorPos).insert(suggestion);

      // Apply to client
      quillRef.current.updateContents(insertDelta);
      quillRef.current.setSelection(cursorPos + suggestion.length);

      // Send through websocket
      const customInsertDelta = new CustomDelta(insertDelta.ops);
      sendMessage({
        action: dataActionEnum.SEND,
        roomName: documentId,
        message: customInsertDelta,
      });

      // Save to server
      setSaveStatus(saveStatusEnum.SAVING);
      queueSave(customInsertDelta);

      // Update baseline
      lastSavedDeltaRef.current = quillRef.current.getContents();
    } else {
      // Find the currentWord in the text near the cursor position
      // Look backwards from cursor to find where currentWord starts
      let wordStart = -1;
      for (let i = cursorPos; i >= currentWord.length; i--) {
        const potentialWord = text.slice(i - currentWord.length, i);
        if (potentialWord === currentWord) {
          wordStart = i - currentWord.length;
          break;
        }
      }

      if (wordStart === -1) {
        const insertDelta = new Delta().retain(cursorPos).insert(suggestion);

        quillRef.current.updateContents(insertDelta);
        quillRef.current.setSelection(cursorPos + suggestion.length);

        const customInsertDelta = new CustomDelta(insertDelta.ops);
        sendMessage({
          action: dataActionEnum.SEND,
          roomName: documentId,
          message: customInsertDelta,
        });

        setSaveStatus(saveStatusEnum.SAVING);
        queueSave(customInsertDelta);
        lastSavedDeltaRef.current = quillRef.current.getContents();
      } else {
        const replaceDelta = new Delta()
          .retain(wordStart)
          .delete(currentWord.length)
          .insert(suggestion);

        // Apply locally first
        quillRef.current.updateContents(replaceDelta);
        quillRef.current.setSelection(wordStart + suggestion.length);

        // Send through websocket
        const customReplaceDelta = new CustomDelta(replaceDelta.ops);
        sendMessage({
          action: dataActionEnum.SEND,
          roomName: documentId,
          message: customReplaceDelta,
        });

        // Save to server
        setSaveStatus(saveStatusEnum.SAVING);
        queueSave(customReplaceDelta);

        // Update baseline
        lastSavedDeltaRef.current = quillRef.current.getContents();
      }
    }

    // Close autocomplete
    setShowAutocomplete(false);
    setCurrentWord("");
  };

  const handleAutocompleteClose = () => {
    setShowAutocomplete(false);
  };

  // Handle selection changes that might affect autocomplete
  useEffect(() => {
    if (!quillRef.current) return;

    const handleSelectionChange = (range) => {
      if (!range) {
        setShowAutocomplete(false);
        return;
      }

      // Update autocomplete position based on selection
      const { show, word } = shouldShowAutocomplete();
      if (show) {
        setAutocompletePosition(getCursorPosition());
        setShowAutocomplete(true);
        setCurrentWord(word);
      } else {
        setShowAutocomplete(false);
        setCurrentWord("");
      }
    };

    const quill = quillRef.current;
    quill.on("selection-change", handleSelectionChange);

    return () => {
      if (quill) {
        quill.off("selection-change", handleSelectionChange);
      }
    };
  }, [quillRef]);

  const handleStartPreview = async (version) => {
    if (!quillRef.current) return;

    try {
      // Store original content before preview
      setOriginalContent(quillRef.current.getContents());

      // Fetch and load the version content
      const versionContent = await getVersionContent(
        documentId,
        version.versionNumber,
      );
      if (versionContent) {
        quillRef.current.setContents(new Delta(versionContent));
      }

      setPreviewVersion(version);
      setIsPreviewMode(true);
      setShowVersionHistoryModal(false);
    } catch (error) {
      // TODO: Add toast error handling
      console.error("Failed to load version content for preview:", error);
    }
  };

  const handleStopPreview = () => {
    if (!quillRef.current || !originalContent) return;

    // Restore original content
    quillRef.current.setContents(originalContent);
    setIsPreviewMode(false);
    setPreviewVersion(null);
    setOriginalContent(null);
  };

  return (
    <div className="document-page">
      <DocumentHeader
        documentTitle={documentTitle}
        setDocumentTitle={setDocumentTitle}
        handleTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        navigate={navigate}
        openShareModal={() => handleShareModal()}
        openVersionModal={() => handlerVersionHistoryModal()}
        openSummaryModal={() => handleSummaryModal()}
        user={user}
        loading={loading}
        collaboratorProfiles={
          <ActiveCollaborators profiles={collaboratorProfiles} />
        }
        userRole={userRole}
      />
      {isPreviewMode && (
        <div className="preview-banner">
          <div className="preview-info">
            <span className="preview-label">
              Previewing Version #{previewVersion?.versionNumber}
            </span>
            <span className="preview-description">
              You are viewing a previous version of this document
            </span>
          </div>
          <button className="btn-stop-preview" onClick={handleStopPreview}>
            Stop Preview
          </button>
        </div>
      )}
      <div className="document-content">
        <div className="editor-container">
          <div ref={editorRef}></div>
        </div>
        <AutocompleteDropdown
          quillRef={quillRef}
          isVisible={showAutocomplete}
          onSuggestionSelect={handleAutocompleteSelect}
          onClose={handleAutocompleteClose}
          position={autocompletePosition}
          currentWord={currentWord}
        />
      </div>
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
          onStartPreview={handleStartPreview}
        />
      )}
      {showSummaryModal && (
        <SummaryModal
          closeModal={() => setShowSummaryModal(false)}
          documentId={documentId}
          quillRef={quillRef}
        />
      )}
    </div>
  );
}
