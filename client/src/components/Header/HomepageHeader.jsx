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

        </>
    )
}


export default Header
