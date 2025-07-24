import { saveStatusEnum } from "../../../utils/constants";
import "../../../pages/styles/DocumentPage.css";

export default function DocumentHeader({
  documentTitle,
  setDocumentTitle,
  handleTitleChange,
  saveStatus,
  navigate,
  openShareModal,
  openVersionModal,
  user,
  loading,
  collaboratorProfiles,
  userRole,
}) {
  return (
    <div className="document-header">
      <div className="document-left-section">
        <div className="document-logo">LiveDocs</div>
        <div className="save-status">
          {saveStatus === saveStatusEnum.SAVING && (
            <span className="saving">
              <span className="spinner" /> {saveStatus}
            </span>
          )}
          {saveStatus === saveStatusEnum.SAVED && (
            <span className="saved">{saveStatus}</span>
          )}
          {saveStatus === saveStatusEnum.ERROR && (
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
            onChange={(e) => setDocumentTitle(e.target.value)}
            onKeyDown={handleTitleChange}
            placeholder="Untitled document"
            id="title-input"
            disabled={userRole === "VIEWER"}
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
        <button
          className="document-button version-history-button"
          onClick={openVersionModal}
        >
          Versions
        </button>
        <button
          className="document-button share-button"
          onClick={openShareModal}
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
        {collaboratorProfiles?.length > 0 && (
          <div className="collaborators">{collaboratorProfiles}</div>
        )}
      </div>
    </div>
  );
}
