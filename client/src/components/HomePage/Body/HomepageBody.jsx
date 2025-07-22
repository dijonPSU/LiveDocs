import React, { useEffect, useState, useCallback } from "react";
import CreateDocumentModal from "../../HomePage/Modals/CreateDocumentModal";
import "./HomepageBody.css";
import DocumentOptionsModal from "../Modals/HomepageDocumentOptionsModal";
import { useUser } from "../../../hooks/useUser";
import { getUserDocuments } from "../../../utils/dataFetcher";
import DocumentCard from "./DocumentCardC";
import { useWS } from "../../../context/WebsocketContext";
import { dataActionEnum } from "../../../utils/constants";
import Toast from "../../../utils/toast";

const HomepageBody = () => {
  const [isCreateDocumentModalOpen, setIsCreateDocumentModalOpen] =
    useState(false);
  const [isDocumentOptionsModalOpen, setIsDocumentOptionsModalOpen] =
    useState(false);
  const [modalPosition, setModalPosition] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [toast, setToast] = useState("");
  const { user } = useUser();
  const { addListener } = useWS();

  const loadDocuments = useCallback(async () => {
    const docs = await getUserDocuments();
    setDocuments(docs);
  }, []);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, loadDocuments]);

  useEffect(() => {
    const unsubscribe = addListener((data) => {
      if (data.action === dataActionEnum.NOTIFICATION) {
        setToast(data.message || "You have a new notification!");
        loadDocuments();
      }
    });
    return unsubscribe;
  }, [addListener, loadDocuments]);

  const toggleModal = () => setIsCreateDocumentModalOpen((v) => !v);
  const handleCloseCreateDocumentModal = () =>
    setIsCreateDocumentModalOpen(false);
  const handleCloseDocumentOptionsModal = () =>
    setIsDocumentOptionsModalOpen(false);

  const handleDeleteDocument = (deletedId) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== deletedId));
  };

  const handleDocumentOptionsClick = (e, docID) => {
    e.stopPropagation();
    const buttonRect = e.currentTarget.getBoundingClientRect();
    setModalPosition({
      left: buttonRect.left,
      bottom: buttonRect.bottom,
    });
    setDocumentId(docID);
    setIsDocumentOptionsModalOpen(true);
  };

  return (
    <div className="homepage-body">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="homepage-content">
        <section className="recent-documents">
          <div className="section-header">
            <h2>Recent documents</h2>
          </div>
          <div className="documents-grid">
            <div className="document-card create-new" onClick={toggleModal}>
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
                onEditClick={(e) => handleDocumentOptionsClick(e, doc.id)}
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
          documentId={documentId}
          onDelete={handleDeleteDocument}
        />
      )}
    </div>
  );
};

export default HomepageBody;
