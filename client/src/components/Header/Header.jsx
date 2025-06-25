import './styleHeader.css'

const Header = () => {
    return (
        <>
            <div className="Top-Header">
                <div className="logo-container">
                    <h1>LiveDocs</h1>
                </div>
                <div className="header-actions">
                    <div className="search-container">
                        <span className="search-icon">🔍</span>
                        <input className="search-input" placeholder="Search" />
                    </div>
                    <div className="header-buttons">
                        <button className="header-button share-button">Share</button>
                        <button className="header-profile">DM</button>
                    </div>
                </div>
            </div>
            <div className="toolbar">
                <div className='toolbar-title'>
                    <h2>Create new document</h2>
                </div>
                <div className='toolbar-items'>
                    <div className="document-preview-container">
                        <button className="document-preview-button">
                            <div className="document-preview">
                                <div className="preview-content">
                                    <div className="preview-line"></div>
                                    <div className="preview-line short"></div>
                                    <div className="preview-line medium"></div>
                                </div>
                            </div>
                            <span className="preview-label">Blank document</span>
                        </button>
                        <button className="document-preview-button">
                            <div className="document-preview template">
                                <div className="preview-content">
                                    <div className="preview-title"></div>
                                    <div className="preview-line"></div>
                                    <div className="preview-line short"></div>
                                </div>
                            </div>
                            <span className="preview-label">Report template</span>
                        </button>
                        <button className="document-preview-button">
                            <div className="document-preview template">
                                <div className="preview-content">
                                    <div className="preview-header"></div>
                                    <div className="preview-line"></div>
                                    <div className="preview-line medium"></div>
                                </div>
                            </div>
                            <span className="preview-label">Letter template</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}


export default Header
