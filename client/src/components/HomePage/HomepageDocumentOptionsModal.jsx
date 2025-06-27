import React, { useEffect, useRef } from 'react';

export default function DocumentOptionsModal({ closeModal, position }) {
    const modalRef = useRef(null);

    useEffect(() => {
        // closes modal when clicked outside of modal
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                closeModal();
            }
        }


        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [closeModal]);

    // calculate position styles
    const positionStyle = position ? {
        position: 'absolute',
        top: `${position.bottom}px`,
        left: `${position.left}px`,
        zIndex: 1000,
    } : {};

    return (
        <div ref={modalRef} className="document-options-dropdown" style={positionStyle}>
            <div className="edit-options-modal-content">
                <button>Rename</button>
                <button>Remove</button>
                <button>Open In New Tab</button>
            </div>
        </div>
    );
}
