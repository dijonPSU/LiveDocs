import { useEffect } from "react";
import Quill from "quill";
import QuillCursors from "quill-cursors";

Quill.register("modules/cursors", QuillCursors);

export default function useQuillEditor(editorRef, quillRef, onTextChange) {
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          cursors: true,
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ color: [] }],
            [{ list: "bullet" }],
          ],
        },
      });

      quillRef.current.on("text-change", onTextChange);
    }
  }, [editorRef, quillRef, onTextChange]);
}
