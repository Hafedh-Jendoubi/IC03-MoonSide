'use client'

import { Mail, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { openTeamsChat } from '@/lib/ms-teams'
import { openOutlookCompose } from '@/lib/outlook'

interface ContactOptionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Display name of the person being contacted, used in copy. */
  recipientName: string
  /** Email address to message — both options are keyed off this. */
  recipientEmail: string
}

/**
 * Small modal shown when the user clicks "Message" on someone's profile.
 * Lets them choose how they want to reach out — a Teams chat or an
 * Outlook email — instead of jumping straight into Teams.
 */
export function ContactOptionsModal({
  open,
  onOpenChange,
  recipientName,
  recipientEmail,
}: ContactOptionsModalProps) {
  const handleOutlook = () => {
    openOutlookCompose(recipientEmail)
    onOpenChange(false)
  }

  const handleTeams = () => {
    openTeamsChat(recipientEmail)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Message {recipientName}</DialogTitle>
          <DialogDescription>Choose how you'd like to get in touch.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          <button
            type="button"
            onClick={handleOutlook}
            className="border-border hover:border-primary hover:bg-primary/5 group flex items-center gap-3 rounded-xl border p-4 text-left transition-colors"
          >
            <div className="bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-foreground font-medium">Email via Outlook</p>
              <p className="text-muted-foreground text-sm">{recipientEmail}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleTeams}
            className="border-border hover:border-primary hover:bg-primary/5 group flex items-center gap-3 rounded-xl border p-4 text-left transition-colors"
          >
            <div className="bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-foreground font-medium">Message via Teams</p>
              <p className="text-muted-foreground text-sm">Start a Teams chat</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
