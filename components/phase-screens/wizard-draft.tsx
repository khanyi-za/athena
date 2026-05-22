import { WizardShell } from '@/components/wizard/wizard-shell'

// BUYER + DRAFT view. The shell handles its own data fetching (via useStoreMe)
// and renders the section-based setup wizard with autosave per field.
//
// Real implementation lives in components/wizard/* — see store-frontend-flows §2.2.
// The submit action is wired in Checkpoint E.

export function WizardDraftScreen() {
  return <WizardShell />
}
