import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateDocumentModal from "../../DocumentPage/CreateDocumentModal";
import "./HomepageBody.css";
import DocumentOptionsModal from "../Modals/HomepageDocumentOptionsModal";
import { useUser } from "../../../hooks/useUser";
import { getUserDocuments } from "../../../utils/dataFetcher";
import { formatDistanceToNow } from "date-fns";

const HomepageBody = () => {
  const navigate = useNavigate();
  const [isCreateDocumentModalOpen, setIsCreateDocumentModalOpen] =
    useState(false);
  const [isDocumentOptionsModalOpen, setIsDocumentOptionsModalOpen] =
    useState(false);
  const [modalPosition, setModalPosition] = useState(null);
  const [documents, setDocuments] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    const loadDocuments = async () => {
      const documents = await getUserDocuments();
      setDocuments(documents);
    };

    if (user) {
      loadDocuments();
    }
  }, [user]);

  const toggleModal = () => {
    setIsCreateDocumentModalOpen(!isCreateDocumentModalOpen);
  };

  const handleCloseCreateDocumentModal = () => {
    setIsCreateDocumentModalOpen(false);
  };

  const handleCloseDocumentOptionsModal = () => {
    setIsDocumentOptionsModalOpen(false);
  };

  const handleDocumentOptionsClick = (e) => {
    e.stopPropagation();
    const buttonRect = e.currentTarget.getBoundingClientRect();
    setModalPosition({
      left: buttonRect.left,
      bottom: buttonRect.bottom,
    });
    setIsDocumentOptionsModalOpen(true);
  };

  return (
    <div className="homepage-body">
      <div className="homepage-content">
        <section className="recent-documents">
          <div className="section-header">
            <h2>Recent documents</h2>
          </div>

          <div className="documents-grid">
            <div
              className="document-card create-new"
              onClick={() => {
                toggleModal();
              }}
            >
              <div className="document-preview blank">
                <div className="plus-icon">+</div>
              </div>
              <div className="document-info">
                <p className="document-title">Blank document</p>
              </div>
            </div>

            {documents.map((doc) => (
              <div
                className="document-card"
                key={doc.id}
                onClick={() => navigate("/DocumentPage")}
              >
                <div className="document-preview">
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                    <div className="preview-line medium"></div>
                  </div>
                </div>
                <div className="document-info">
                  <p className="document-title">{doc.title}</p>
                  <p className="document-date">
                    Last Edited:{" "}
                    {formatDistanceToNow(new Date(doc.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <div className="document-edit">
                    <button
                      onClick={handleDocumentOptionsClick}
                      className="document-button"
                    >
                      <strong>EDIT</strong>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {isCreateDocumentModalOpen && (
        <CreateDocumentModal closeModal={handleCloseCreateDocumentModal} />
      )}
      {isDocumentOptionsModalOpen && (
        <DocumentOptionsModal
          closeModal={handleCloseDocumentOptionsModal}
          position={modalPosition}
        />
      )}
    </div>
  );
};

export default HomepageBody;
