import React, { useEffect, useState } from "react";
import CreateDocumentModal from "../../Homepage/Modals/CreateDocumentModal";
import "./HomepageBody.css";
import DocumentOptionsModal from "../Modals/HomepageDocumentOptionsModal";
import { useUser } from "../../../hooks/useUser";
import { getUserDocuments } from "../../../utils/dataFetcher";
import DocumentCard from "./DocumentCardC";

const HomepageBody = () => {
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
              <DocumentCard
                key={doc.id}
                doc={doc}
                onEditClick={handleDocumentOptionsClick}
              />
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
