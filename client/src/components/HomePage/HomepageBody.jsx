import React,  {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import CreateDocumentModal from '../DocumentPage/CreateDocumentModal';
import './HomepageBody.css';
import DocumentPage from '../../pages/DocumentPage';

const HomepageBody = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sample dummy documents
    const dummyDocuments = [
        { id: 1, title: 'Project Proposal', lastEdited: '2 days ago' },
        { id: 2, title: 'Meeting Notes', lastEdited: '1 week ago' },
        { id: 3, title: 'Budget Report', lastEdited: '2 weeks ago' },
        { id: 4, title: 'Marketing Plan', lastEdited: '3 weeks ago' },
        { id: 5, title: 'Research Summary', lastEdited: '1 month ago' },
        { id: 6, title: 'Dijon Summary', lastEdited: '3 month ago' },
    ];

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        warn("test");
    }


    return (
        <div className="homepage-body">
            <div className="homepage-content">
                <section className="recent-documents">
                    <div className="section-header">
                        <h2>Recent documents</h2>
                    </div>

                    <div className="documents-grid">
                        <div className="document-card create-new" onClick={() => {toggleModal()}}> {/* onClick={() => navigate('/DocumentPage')} */}
                            <div className="document-preview blank">
                                <div className="plus-icon">+</div>
                            </div>
                            <div className="document-info">
                                <p className="document-title">Blank document</p>
                            </div>
                        </div>

                        {dummyDocuments.map(doc => (
                            <div className="document-card" key={doc.id} onClick={() => navigate('/DocumentPage')}>
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
                                        <button className="document-button"><strong>...</strong></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            {isModalOpen && <CreateDocumentModal closeModal={handleCloseModal}/>}
        </div>
    );
};

export default HomepageBody;
