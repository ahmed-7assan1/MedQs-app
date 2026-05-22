"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Undo, Redo, CheckSquare, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Highlighter
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({ content, onChange, placeholder = "Start writing...", className }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Typography,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-4 text-sm leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const toggleMark = useCallback((mark: string) => {
    if (!editor) return;
    const actions: Record<string, () => void> = {
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      underline: () => editor.chain().focus().toggleUnderline().run(),
      strike: () => editor.chain().focus().toggleStrike().run(),
      code: () => editor.chain().focus().toggleCode().run(),
      highlight: () => editor.chain().focus().toggleHighlight().run(),
    };
    actions[mark]?.();
  }, [editor]);

  const toggleBlock = useCallback((block: string) => {
    if (!editor) return;
    const actions: Record<string, () => void> = {
      h1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      h2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      h3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      bulletList: () => editor.chain().focus().toggleBulletList().run(),
      orderedList: () => editor.chain().focus().toggleOrderedList().run(),
      blockquote: () => editor.chain().focus().toggleBlockquote().run(),
      taskList: () => editor.chain().focus().toggleTaskList().run(),
      horizontalRule: () => editor.chain().focus().setHorizontalRule().run(),
    };
    actions[block]?.();
  }, [editor]);

  if (!editor) return null;

  const ToolBtn = ({ active, onClick, icon: Icon, title }: { active: boolean; onClick: () => void; icon: any; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-all",
        active ? "bg-indigo-500/20 text-indigo-300" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon size={15} />
    </button>
  );

  return (
    <div className={cn("rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden", className)}>
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/[0.04] bg-white/[0.02] overflow-x-auto no-scrollbar">
        <ToolBtn active={editor.isActive("bold")} onClick={() => toggleMark("bold")} icon={Bold} title="Bold" />
        <ToolBtn active={editor.isActive("italic")} onClick={() => toggleMark("italic")} icon={Italic} title="Italic" />
        <ToolBtn active={editor.isActive("underline")} onClick={() => toggleMark("underline")} icon={UnderlineIcon} title="Underline" />
        <ToolBtn active={editor.isActive("strike")} onClick={() => toggleMark("strike")} icon={Strikethrough} title="Strikethrough" />
        <ToolBtn active={editor.isActive("code")} onClick={() => toggleMark("code")} icon={Code} title="Inline Code" />
        <ToolBtn active={editor.isActive("highlight")} onClick={() => toggleMark("highlight")} icon={Highlighter} title="Highlight" />
        <span className="w-px h-5 bg-white/[0.06] mx-1" />
        <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => toggleBlock("h1")} icon={Heading1} title="Heading 1" />
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => toggleBlock("h2")} icon={Heading2} title="Heading 2" />
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => toggleBlock("h3")} icon={Heading3} title="Heading 3" />
        <span className="w-px h-5 bg-white/[0.06] mx-1" />
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => toggleBlock("bulletList")} icon={List} title="Bullet List" />
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => toggleBlock("orderedList")} icon={ListOrdered} title="Ordered List" />
        <ToolBtn active={editor.isActive("taskList")} onClick={() => toggleBlock("taskList")} icon={CheckSquare} title="Task List" />
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => toggleBlock("blockquote")} icon={Quote} title="Blockquote" />
        <ToolBtn active={false} onClick={() => toggleBlock("horizontalRule")} icon={Minus} title="Divider" />
        <span className="w-px h-5 bg-white/[0.06] mx-1" />
        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} icon={AlignLeft} title="Align Left" />
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} icon={AlignCenter} title="Center" />
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} icon={AlignRight} title="Align Right" />
        <span className="w-px h-5 bg-white/[0.06] mx-1" />
        <ToolBtn active={false} onClick={() => editor.chain().focus().undo().run()} icon={Undo} title="Undo" />
        <ToolBtn active={false} onClick={() => editor.chain().focus().redo().run()} icon={Redo} title="Redo" />
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255,255,255,0.15);
          pointer-events: none;
          height: 0;
        }
        .tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
        .tiptap ul[data-type="taskList"] li > label { flex-shrink: 0; }
        .tiptap ul[data-type="taskList"] li[data-checked] > div > p { text-decoration: line-through; opacity: 0.5; }
      `}</style>
    </div>
  );
}
