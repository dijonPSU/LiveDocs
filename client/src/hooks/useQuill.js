import { useEffect } from "react";
import Quill from "quill";
import QuillCursors from "quill-cursors";
import { documentRolesEnum } from "../utils/constants";

Quill.register("modules/cursors", QuillCursors);

export default function useQuillEditor(
  editorRef,
  quillRef,
  onTextChange,
  userRole,
) {
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        readOnly: userRole === documentRolesEnum.VIEWER,
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

    // When userRole changes, update Quill's readOnly state
    if (quillRef.current) {
      quillRef.current.enable(userRole !== documentRolesEnum.VIEWER);
    }
  }, [editorRef, quillRef, onTextChange, userRole]);
}
