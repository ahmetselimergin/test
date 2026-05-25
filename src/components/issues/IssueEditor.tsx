'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Code, Strikethrough } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'

interface CreateProps {
  mode: 'create'
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

interface EditProps {
  mode?: 'edit'
  issueId: string
  initialContent: string
}

type IssueEditorProps = CreateProps | EditProps

function ToolbarButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'size-6 flex items-center justify-center rounded transition-colors',
        active
          ? 'bg-accent/20 text-accent'
          : 'text-muted hover:text-foreground hover:bg-subtle'
      )}
    >
      {children}
    </button>
  )
}

export function IssueEditor(props: IssueEditorProps) {
  const isCreate = props.mode === 'create'
  const updateIssue = useIssueStore((s) => s.updateIssue)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: isCreate
          ? ((props as CreateProps).placeholder ?? 'Açıklama ekle...')
          : 'Açıklama ekle...',
      }),
    ],
    content: isCreate
      ? (props as CreateProps).value
      : (props as EditProps).initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[80px] text-[13px] leading-relaxed text-foreground prose-p:my-1 prose-ul:my-1 prose-ol:my-1',
      },
    },
    onUpdate: ({ editor }) => {
      if (isCreate) {
        ;(props as CreateProps).onChange(editor.getHTML())
      }
    },
    onBlur: async ({ editor }) => {
      if (!isCreate) {
        const content = editor.getHTML()
        const editProps = props as EditProps
        updateIssue(editProps.issueId, { description: content })
        const supabase = createClient()
        await supabase
          .from('issues')
          .update({ description: content })
          .eq('id', editProps.issueId)
      }
    },
  })

  if (!editor) return null

  return (
    <div className="rounded-lg border border-subtle bg-[rgb(var(--bg-subtle)/0.5)] overflow-hidden focus-within:border-accent/40 transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-subtle">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold size={12} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic size={12} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <Strikethrough size={12} />
        </ToolbarButton>
        <div className="w-px h-3.5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List size={12} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered size={12} />
        </ToolbarButton>
        <div className="w-px h-3.5 bg-border mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
        >
          <Code size={12} />
        </ToolbarButton>
      </div>
      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
