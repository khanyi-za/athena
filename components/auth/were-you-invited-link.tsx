// Small recovery link per employee-journey.md §7 (Step 4 disambiguation).
// Surfaced on screens where an employee might land by mistake — chiefly the
// onboarding picker, which would otherwise be confusing for an employee whose
// localStorage was cleared. The link tells them where to look without forcing
// them to ask the merchant for a fresh invite.

export function WereYouInvitedLink() {
  return (
    <p className="text-center text-xs text-muted-foreground">
      Were you invited to a store? Find your invite email — the link in there
      will bring you in.
    </p>
  )
}
