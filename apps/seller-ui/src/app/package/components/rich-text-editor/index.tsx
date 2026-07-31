"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import "react-quill-new/dist/quill.snow.css";

type ReactQuillProps = React.ComponentProps<
  (typeof import("react-quill-new"))["default"]
>;

const ReactQuill = dynamic<ReactQuillProps>(
  () => import("react-quill-new").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[320px] rounded-md border border-[#1f2937] bg-[#05070d]" />
    ),
  }
);

const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (content: string) => void;
}) => {
  const [editorValue, setEditorValue] = useState(value || "");
  const quillRef = useRef(false);

  useEffect(() => {
    if (!quillRef.current) {
      quillRef.current = true;

      setTimeout(() => {
        document
          .querySelectorAll(".ql-toolbar")
          .forEach((toolbar, index) => {
            if (index > 0) {
              toolbar.remove();
            }
          });
      }, 100);
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-md border border-[#1f2937] bg-[#05070d] shadow-[0_18px_48px_-36px_rgba(0,0,0,0.95)]">
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={(content) => {
          setEditorValue(content);
          onChange(content);
        }}
        modules={{
          toolbar: [
            [{ font: [] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ size: ["small", false, "large", "huge"] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ script: "sub" }, { script: "super" }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ align: [] }],
            ["blockquote", "code-block"],
            ["link", "image", "video"],
            ["clean"],
          ],
        }}
        placeholder="Write a detailed product description here..."
        className="text-white"
        style={{
          minHeight: "320px",
        }}
      />

      <style>{`
        .ql-toolbar {
          align-items: center;
          background: #0b1220;
          border: 0 !important;
          border-bottom: 1px solid #1f2937 !important;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 14px !important;
        }

        .ql-toolbar .ql-formats {
          align-items: center;
          display: inline-flex;
          gap: 4px;
          margin-right: 4px !important;
        }

        .ql-toolbar button {
          border-radius: 6px;
          height: 30px !important;
          transition: background 150ms ease, color 150ms ease;
          width: 30px !important;
        }

        .ql-toolbar button:hover,
        .ql-toolbar button.ql-active {
          background: #1d4ed8;
        }

        .ql-container {
          background: #05070d !important;
          border: 0 !important;
          color: white;
          font-size: 15px;
        }

        .ql-picker,
        .ql-snow .ql-picker {
          color: #e5e7eb !important;
        }

        .ql-editor {
          line-height: 1.7;
          min-height: 300px;
          padding: 18px 20px;
        }

        .ql-snow {
          border-color: #1f2937 !important;
        }

        .ql-editor.ql-blank::before {
          color: #6b7280 !important;
          font-style: italic;
          left: 20px;
          right: 20px;
        }

        .ql-picker-options {
          background: #111827 !important;
          border-color: #1f2937 !important;
          color: white !important;
          padding: 6px !important;
        }

        .ql-picker-item {
          color: white !important;
        }

        .ql-snow .ql-stroke {
          stroke: #d1d5db !important;
        }

        .ql-snow .ql-fill {
          fill: #d1d5db !important;
        }

        .ql-snow .ql-picker-label {
          border-radius: 6px;
        }

        .ql-snow .ql-picker-label:hover,
        .ql-snow .ql-picker-label.ql-active {
          background: #111827;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
