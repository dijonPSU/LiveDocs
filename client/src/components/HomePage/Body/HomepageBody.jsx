import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateDocumentModal from "../../DocumentPage/CreateDocumentModal";
import "./HomepageBody.css";
import DocumentOptionsModal from "../Modals/HomepageDocumentOptionsModal";
import { useUser } from "../../../hooks/useUser";

const HomepageBody = () => {
  const navigate = useNavigate();
  const [isCreateDocumentModalOpen, setIsCreateDocumentModalOpen] =
    useState(false);
  const [isDocumentOptionsModalOpen, setIsDocumentOptionsModalOpen] =
    useState(false);
  const [modalPosition, setModalPosition] = useState(null);

  const { user } = useUser();
  console.log(user);
  // Sample dummy documents
  const dummyDocuments = [
    { id: 1, title: "Project Proposal", lastEdited: "2 days ago" },
    { id: 2, title: "Meeting Notes", lastEdited: "1 week ago" },
    { id: 3, title: "Budget Report", lastEdited: "2 weeks ago" },
    { id: 4, title: "Marketing Plan", lastEdited: "3 weeks ago" },
    { id: 5, title: "Research Summary", lastEdited: "1 month ago" },
    { id: 6, title: "Dijon Summary", lastEdited: "3 month ago" },
  ];

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

  // will breakdown into smaller components
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

            {dummyDocuments.map((doc) => (
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
                  <p className="document-date">Last edited {doc.lastEdited}</p>
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
