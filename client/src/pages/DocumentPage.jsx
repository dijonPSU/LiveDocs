import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router";
import { connectTestToWebsocket } from "../utils/dataFetcher";
import "quill/dist/quill.snow.css";
import "../pages/styles/DocumentPage.css";

export default function DocumentPage() {
  // get document name from navigation state
  const location = useLocation();
  const { state } = location;
  const { documentName } = state || "Untitled Document";

  const navigate = useNavigate();
  const [webSocket, setWebSocket] = useState(null); // so we can access socket from anywhere
  const [documentTitle, setDocumentTitle] = useState(documentName);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

    // connect to server (will only connect when user share document -> have to implement)
    useEffect(() => {
      const websocketConnect = connectTestToWebsocket();
      setWebSocket(websocketConnect);

      return () => {
        websocketConnect.close();
      };
    }, [])


  //  quill editor { For now until we have a custom text editor }
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const quillOptions = {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ align: [] }],
            ["link", "image"],
            ["clean"],
          ],
        },
      };
      quillRef.current = new Quill(editorRef.current, quillOptions);
    }
  }, []);

  // use effect for sending changes to server
  useEffect(() => {
    if (webSocket == null || quillRef.current == null) return;

    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== "user") return; // so we can only send changes from user
      console.log("Sending changes to server:", delta);

      // send changes to server
      //send("send-changes", delta);
      sendUpdate(webSocket, delta);


    };
    quillRef.current.on("text-change", handleTextChange);

    return () => {
      quillRef.current.off("text-change", handleTextChange);
    };
  }, [webSocket]);


  // use effect for receiving changes from server
  useEffect(() => {
    if (webSocket == null || quillRef.current == null) return;

    const handleServerChanges = (delta) => {
      quillRef.current.updateContents(delta);
    };

    //socket.on("receive-changes", handleServerChanges);

    return () => {
      webSocket.onclose = () => {("receive-changes", handleServerChanges);}
    };
  }, [webSocket]);






  // Handle document title change
  const handleTitleChange = (e) => {
    setDocumentTitle(e.target.value);
  };

  return (
    <div className="document-page">
      {/* Document Header */}
      <div className="document-header">
        <div className="document-logo">LiveDocs</div>

        <div className="document-title-container">
          <input
            type="text"
            className="document-title-input"
            value={documentTitle}
            onChange={handleTitleChange}
            placeholder="Untitled document"
          />
        </div>

        <div className="document-actions">
          <button
            className="document-button back-to-homepage-button"
            onClick={() => navigate("/Homepage")}
          >
            Back To Homepage
          </button>
          <button className="document-button share-button">Share</button>
          <div className="user-avatar">DM</div>{" "}
          {/* PLACEHOLER will change when userAUTH is done */}
        </div>
      </div>

      {/* Document Content */}
      <div className="document-content">
        <div className="editor-container">
          <div ref={editorRef}></div>
        </div>
      </div>
    </div>
  );
}



function sendUpdate(webSocket, delta) {
  webSocket.send(JSON.stringify({ action: "send", message: delta }));
  console.log("Sent update to server:", delta);
}
