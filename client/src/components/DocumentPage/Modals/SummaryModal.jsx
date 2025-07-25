import React, { useState } from "react";
import { summarizeDocument } from "../../../utils/dataFetcher";
import "./styles/SummaryModal.css";

export default function SummaryModal({ closeModal, documentId, quillRef }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateSummary = async () => {
    if (!quillRef.current) {
      setError("Document content not available");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
      // Get the document text content from Quill
      const documentText = quillRef.current.getText();

      if (!documentText.trim()) {
        setError("Document is empty,add some content to summarize");
        setLoading(false);
        return;
      }

      const response = await summarizeDocument(documentId, documentText);

      if (response && response.summary) {
        setSummary(response.summary);
      } else {
        setError("Failed to generate summary, try again");
      }
    } catch (err) {
      console.error("Error generating summary:", err);
      setError("Failed to generate summary, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Document Summary</h2>
        </div>
        <div className="modal-body">
          {!summary && !loading && (
            <div className="summary-prompt">
              <p>Generate an summary of your document content.</p>
              <button
                type="button"
                className="btn btn-primary generate-summary-btn"
                onClick={handleGenerateSummary}
                disabled={loading}
              >
                Generate Summary
              </button>
            </div>
          )}

          {loading && (
            <div className="summary-loading">
              <div className="loading-spinner"></div>
              <p>Generating summary...</p>
            </div>
          )}

          {error && (
            <div className="summary-error">
              <p className="error-message">{error}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateSummary}
                disabled={loading}
              >
                Try Again
              </button>
            </div>
          )}

          {summary && (
            <div className="summary-content">
              <div className="summary-text">{summary}</div>
              <button
                type="button"
                className="btn btn-secondary regenerate-btn"
                onClick={handleGenerateSummary}
                disabled={loading}
              >
                Regenerate Summary
              </button>
            </div>
          )}

          <div className="document-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
