"use client";

import * as React from "react";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Eraser,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  ariaInvalid?: boolean;
};

type FontSizeChain = {
  setMark: (mark: string, attrs: Record<string, string | null>) => FontSizeChain;
  removeEmptyTextStyle: () => FontSizeChain;
  run: () => boolean;
};

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: { fontSize?: string | null }) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: { chain: () => FontSizeChain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: { chain: () => FontSizeChain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as Record<string, unknown>;
  },
});

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite aqui...",
  className,
  ariaInvalid = false,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      TextStyle,
      FontSize,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] p-3 text-sm outline-none prose prose-sm max-w-none dark:prose-invert",
        "aria-invalid": ariaInvalid ? "true" : "false",
      },
      handleKeyDown(view, event) {
        if (event.key !== "Tab") return false;
        event.preventDefault();
        if (event.shiftKey) {
          view.dispatch(view.state.tr.insertText("    "));
        } else {
          view.dispatch(view.state.tr.insertText("    "));
        }
        return true;
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === (value || "<p></p>")) return;
    editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
  }, [editor, value]);

  const btnClass = "h-8 px-2";
  const btnActive = "bg-primary/15 text-primary";

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(btnClass, editor?.isActive("bold") && btnActive)}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Negrito"
          disabled={!editor}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(btnClass, editor?.isActive("italic") && btnActive)}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Itálico"
          disabled={!editor}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(btnClass, editor?.isActive("underline") && btnActive)}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          title="Sublinhado"
          disabled={!editor}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(btnClass, editor?.isActive("heading", { level: 2 }) && btnActive)}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título H2"
          disabled={!editor}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(btnClass, editor?.isActive("heading", { level: 3 }) && btnActive)}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Subtítulo H3"
          disabled={!editor}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(btnClass, editor?.isActive("bulletList") && btnActive)}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Lista"
          disabled={!editor}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(btnClass, editor?.isActive("orderedList") && btnActive)}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
          disabled={!editor}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={btnClass}
          onClick={() => editor?.chain().focus().setFontSize("0.875rem").run()}
          title="Fonte pequena"
          disabled={!editor}
        >
          A-
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={btnClass}
          onClick={() => editor?.chain().focus().setFontSize("1rem").run()}
          title="Fonte normal"
          disabled={!editor}
        >
          A
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={btnClass}
          onClick={() => editor?.chain().focus().setFontSize("1.25rem").run()}
          title="Fonte grande"
          disabled={!editor}
        >
          A+
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={btnClass}
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Limpar formatação"
          disabled={!editor}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <span className="mx-1 h-4 w-px bg-border" aria-hidden />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={btnClass}
          onClick={() => editor?.chain().focus().undo().run()}
          title="Desfazer"
          disabled={!editor}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={btnClass}
          onClick={() => editor?.chain().focus().redo().run()}
          title="Refazer"
          disabled={!editor}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <div
        className={cn(
          "min-h-[220px]",
          ariaInvalid && "ring-2 ring-destructive/30"
        )}
      >
        <EditorContent editor={editor} />
      </div>
      <style jsx>{`
        :global(.ProseMirror p.is-editor-empty:first-child::before) {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          float: left;
          height: 0;
          pointer-events: none;
        }
        :global(.ProseMirror h2) {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 0.75rem 0 0.5rem;
        }
        :global(.ProseMirror h3) {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.35;
          margin: 0.6rem 0 0.4rem;
        }
        :global(.ProseMirror ul) {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        :global(.ProseMirror ol) {
          list-style: decimal;
          padding-left: 1.25rem;
          margin: 0.5rem 0;
        }
        :global(.ProseMirror li) {
          margin: 0.2rem 0;
        }
        :global(.ProseMirror p) {
          margin: 0.4rem 0;
        }
      `}</style>
    </div>
  );
}
