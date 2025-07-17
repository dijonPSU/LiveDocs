import { useEffect } from "react";
import Quill from "quill";

export default function useQuillEditor(editorRef, quillRef, onTextChange) {
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ color: [] }],
            [{ list: "bullet" }],
          ],
        },
      });

      quillRef.current.on("text-change", onTextChange);
      console.log("quill created", quillRef.current)
    }
  }, [editorRef, quillRef, onTextChange]);
}
