'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Code } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { addComment } from '@/app/actions/notifications'
import type { Comment } from '@/lib/supabase/types'

interface CommentWithAuthor extends Comment {
  author: { full_name: string | null; avatar_url: string | null } | null
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CommentItem({ comment }: { comment: CommentWithAuthor }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: comment.content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none text-[13px] leading-relaxed text-foreground prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5 focus:outline-none',
      },
    },
  })

  return (
    <div className="flex items-start gap-2.5 py-3">
      <Avatar className="size-6 shrink-0 mt-0.5">
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={comment.author.full_name ?? ''}
            className="size-full object-cover rounded-full"
          />
        ) : (
          <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">
            {(comment.author?.full_name ?? '?').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-medium text-foreground">
            {comment.author?.full_name ?? 'Anonim'}
          </span>
          <span className="text-[11px] text-muted-foreground">{formatDate(comment.created_at)}</span>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

interface IssueCommentThreadProps {
  issueId: string
}

export function IssueCommentThread({ issueId }: IssueCommentThreadProps) {
  const comments = useIssueStore((s) => s.comments)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('comments')
      .select('*, author:profiles(full_name, avatar_url)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { console.error('Failed to load comments:', error); return }
        if (data) useIssueStore.getState().setComments(data as CommentWithAuthor[])
      })
    return () => { cancelled = true }
  }, [issueId])

  const [hasContent, setHasContent] = useState(false)

  const writeEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Yorum yaz...' }),
    ],
    onUpdate: ({ editor }) => setHasContent(!editor.isEmpty),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[60px] text-[13px] leading-relaxed text-foreground prose-p:my-0.5',
      },
    },
  })

  async function handleSubmit() {
    if (!writeEditor || !hasContent) return
    const content = writeEditor.getHTML()
    const result = await addComment(issueId, content)
    if ('error' in result && result.error) { toast.error(result.error); return }
    if ('comment' in result && result.comment) {
      useIssueStore.getState().setComments([...useIssueStore.getState().comments, result.comment as CommentWithAuthor])
      writeEditor.commands.clearContent()
      setHasContent(false)
    }
  }

  return (
    <div className="flex flex-col px-4 py-2">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-[12px] text-muted-foreground py-4 text-center">
          Henüz yorum yok. İlk yorumu sen yaz.
        </p>
      ) : (
        <div className="divide-y divide-border/40">
          {(comments as CommentWithAuthor[]).map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </div>
      )}

      {/* Write area */}
      <div className="mt-3 rounded-lg border border-border bg-muted/50 overflow-hidden focus-within:border-primary/40 transition-colors">
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); writeEditor?.chain().focus().toggleBold().run() }}
            className={cn(
              'size-6 flex items-center justify-center rounded transition-colors',
              writeEditor?.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Bold size={12} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); writeEditor?.chain().focus().toggleItalic().run() }}
            className={cn(
              'size-6 flex items-center justify-center rounded transition-colors',
              writeEditor?.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Italic size={12} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); writeEditor?.chain().focus().toggleCode().run() }}
            className={cn(
              'size-6 flex items-center justify-center rounded transition-colors',
              writeEditor?.isActive('code') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Code size={12} />
          </button>
          <div className="flex-1" />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!writeEditor || !hasContent}
            className="h-6 px-2.5 text-[11px] font-medium"
          >
            Gönder
          </Button>
        </div>
        <div
          className="px-3 py-2"
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
        >
          <EditorContent editor={writeEditor} />
        </div>
      </div>
    </div>
  )
}
