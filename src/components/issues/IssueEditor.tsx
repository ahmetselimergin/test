'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback } from 'react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'

interface IssueEditorProps {
  issueId: string
  initialContent: string
}

export function IssueEditor({ issueId, initialContent }: IssueEditorProps) {
  const { updateIssue } = useIssueStore()

  const saveContent = useCallback(
    async (content: string) => {
      updateIssue(issueId, { description: content })
      const supabase = createClient()
      await supabase.from('issues').update({ description: content }).eq('id', issueId)
    },
    [issueId, updateIssue]
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Açıklama ekle...' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[120px] text-sm',
      },
    },
    onBlur: ({ editor }) => {
      saveContent(editor.getHTML())
    },
  })

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <EditorContent editor={editor} />
    </div>
  )
}
