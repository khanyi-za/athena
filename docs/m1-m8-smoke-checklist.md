# M1–M8 smoke checklist

End-to-end testing pass covering everything built so far. Roughly 75 scenarios across 11 areas.

**Priority markers**
- **P0** must-pass — golden path; breakage blocks the milestone
- **P1** important — typical flow; should work
- **P2** edge / recovery — rare states; nice-to-have

**How to use**
- Check items off as we verify them (`- [x]`)
- Add bug notes under the "Bugs found" section at the bottom — keep them terse: `[area] symptom → repro` is enough; we triage afterwards
- If a P0 fails, note it and move on; don't get stuck

---

## ⏸ Testing pass status — PAUSED (last update 2026-06-06)

**Paused at:** mid-Phase 9. Owner sent first employee invite; invite email URL bug found and shimmed (see backend handoffs); recipient-side accept flow not yet exercised.

**Resume here next session:**
1. Click the invite link as the recipient (signed out / different browser profile) — verify the validation screen renders and the "Accept invite" CTA works
2. Land on welcome screen post-accept; confirm Zustand auth store + localStorage employee-store cache are populated
3. Back on owner side: verify team list shows the now-Active employee row
4. Test resend (on a pending row), deactivate / reactivate / remove (on accepted rows), and the 409 "already invited" pivot path
5. Then Phase 10 (full invite-recipient signed-out + matching + mismatch + returnUrl threading + "Were you invited?" recovery link)

After Phase 9–10, the remaining untouched scope is Phase 5 (archive / delete DRAFT / variant editor / inventory filters), Phase 6 (reject flow with templates, sort toggle, categories CRUD, non-ADMIN soft-redirect), Phase 7 (Active dashboard — first-time celebration modal, metrics, quick-actions), and Phase 8 (Settings page).

**Where we stopped:**
- ✅ Phase 0 — pre-flight: passed
- ✅ Phase 1 — auth: passed (logout race fix landed mid-pass)
- ✅ Phase 2 — onboarding: passed
- ✅ Phase 3 — wizard / M3: passed (5 fixes landed mid-pass — see Bugs found)
- ✅ Phase 4 — APPROVED + Launch: passed (banner gallery, address CRUD, readiness checklist, store launched end-to-end via admin approval)
- 🟡 Phase 5 — Products: PARTIAL (create, launch, media uploads, collections, video uploads tested. Still untouched: archive, delete DRAFT, variant editor, inventory filters/sort/search, archived read-only state)
- 🟡 Phase 6 — Admin tool: PARTIAL (first-review approval, launch approval, product/collection drill-down tested. Untouched: reject flow with templates, sort toggle, categories CRUD, non-ADMIN soft-redirect)
- ⏸ Phase 7 — Active dashboard: NOT STARTED (unblocked — store is ACTIVE)
- ⏸ Phase 8 — Settings page: NOT STARTED
- 🟡 Phase 9 — Team management: JUST STARTED (owner sent first invite; email URL bug found + shimmed; recipient flow + resend + 409 pivot + deactivate/reactivate/remove untouched)
- ⏸ Phase 10 — Invite recipient: NOT STARTED

**Milestones shipped during this testing pass (no longer blockers):**
- **M9 — Multi-media store banner** — landed end-to-end. Backend handoff: `docs/backend-handoffs/store-banner-media.md` (Status: landed).
- **M10 — Merchant collections + categories removed from product editor** — landed end-to-end. Backend handoff: `docs/backend-handoffs/merchant-collections.md` (Status: landed). Also opened collection + product GETs to admin (handoffs: `admin-read-store-collections.md`, `admin-read-store-products.md`).
- **UI "Launch" terminology rename** — user-facing copy migrated from "go-live" / "activate" / "request go-live" to "Launch" variants. Internal state-machine names, API paths, hook names, type/variant strings all unchanged (see `project_merchant_ui.md` memory for the rule).
3. Tester confirms the new gallery loads on the merchant readiness screen with the migrated item visible

**Resume point:** Phase 4 — APPROVED + go-live. The merchant test account from Phase 3 should still be in the APPROVED state (admin approved it before the pause). First items to retest:
- Banner upload — now goes through the **new gallery** instead of the single-image flow. Validate add image / add video / drag reorder / delete / cover semantics
- Readiness checklist banner item — should tick when `bannerMedia.length >= 1`

---

## Phase 0 — Pre-flight

- [ ] **P0** Backend reachable at the `API_URL` set in `.env.local`
- [ ] **P0** `npm run dev` boots without errors; landing on `/` renders
- [ ] **P0** Browser console clean on initial load (no red errors)

## Phase 1 — Auth (M1 baseline + M8 retrofits)

- [ ] **P0** Register new account → "Check your email" screen
- [ ] **P0** Verify email link → auto-login → matrix routes correctly
- [ ] **P0** Login with correct credentials → matrix-routed dashboard
- [ ] **P1** Login with wrong password → "Incorrect email or password"
- [ ] **P1** Forgot password → reset email → reset → login with new password
- [ ] **P1** Logout button (header) → returns to `/login`
- [ ] **P2** Login with `?returnUrl=/some/path` → routes there, not matrix (M8-B)
- [ ] **P2** Register with `?email=foo@bar.com&returnUrl=...` → email prefilled, helper text shown (M8-B)
- [ ] **P2** Suspended/inactive account login attempt → "Account is inactive" handling

## Phase 2 — Onboarding (M2)

- [ ] **P0** BUYER + no store → routes to `/onboarding`
- [ ] **P0** "Start my store" → form → create store → routes to wizard
- [ ] **P1** Duplicate company/display name 409 → inline error on right field
- [ ] **P1** "Were you invited?" recovery link visible at the bottom (M8-D)
- [ ] **P2** "I'm just looking" → explainer card + logout button

## Phase 3 — Wizard (M3)

- [ ] **P0** All 4 sections render: brand identity, contact, business reg, payout
- [ ] **P0** Per-field autosave fires; `AutosaveIndicator` flips through saving → saved
- [ ] **P0** Logo upload (Cloudinary) succeeds → preview shows
- [ ] **P0** Side nav shows completion (X/Y per section + total)
- [ ] **P0** Submit button disabled until 11/11; enabled at 11/11
- [ ] **P0** Submit → confirmation modal → POST → routes to under-review-first screen
- [ ] **P1** Backend missing-fields 400 → top banner + inline field errors highlighted
- [ ] **P2** Rejected DRAFT → rejection banner visible; clears when editing any field

## Phase 4 — APPROVED + go-live (M4)

- [ ] **P0** Approved store renders readiness checklist with correct state
- [ ] **P0** Banner upload (Cloudinary) → autosave → "Saved"
- [ ] **P0** Story textarea autosave
- [ ] **P0** Add / edit / delete addresses (modal flows)
- [ ] **P1** Last-address protection: delete-only-address modal blocks with recovery
- [ ] **P0** Request go-live → modal → POST → routes to under-review-go-live screen
- [ ] **P1** Missing-requirements 400 → banner at top, items listed; checklist refreshes
- [ ] **P2** Go-live rejection banner persists across edits until request-go-live retried

## Phase 5 — Products (M5)

- [ ] **P0** `/dashboard/products` lists inventory with status pills + thumbnails
- [ ] **P0** Create product modal → POST → editor opens
- [ ] **P0** Editor basics autosave (title, price, description)
- [ ] **P0** Image upload to Cloudinary → appears in gallery
- [ ] **P1** Category picker modal → add category to product
- [ ] **P0** Activation contract: 5/5 → "Activate" enables; click → product goes ACTIVE
- [ ] **P0** Archive ACTIVE product → status flips → editor read-only
- [ ] **P1** Delete DRAFT product → confirmation → removed
- [ ] **P1** Last-image on ACTIVE: delete-only-image protected
- [ ] **P1** Last-category on ACTIVE: delete-only-category protected
- [ ] **P2** Status filter tabs work, search filter works, sort works
- [ ] **P2** Page-reset on filter change (no setState-in-effect regression)

## Phase 6 — Admin tool (M6)

- [ ] **P0** ADMIN login → routes to `/admin`
- [ ] **P0** First-review queue: pending stores listed
- [ ] **P0** Sort toggle (oldest/newest) works + resets page
- [ ] **P0** Review detail page renders every submitted field
- [ ] **P0** Approve modal (with optional welcome note) → POST → store moves to APPROVED, returns to queue
- [ ] **P0** Reject modal (with templates dropdown, required ≥10 char reason) → POST → returns to queue
- [ ] **P1** Bank account masked → click reveal → re-mask on blur
- [ ] **P0** Go-live queue: shows readiness signals on each row (products count, locations, banner ✓, story ✓)
- [ ] **P0** Go-live detail: banner at full size, story in full, active products strip
- [ ] **P0** Categories: tree renders with collapse/expand
- [ ] **P0** Create category (root + child) → tree refreshes
- [ ] **P0** Edit category → slug helper text shown
- [ ] **P1** Parent picker disables cycle-creating options
- [ ] **P0** Delete leaf category (no children/products) → confirmation → deleted
- [ ] **P1** Delete category with children → "blocked: has children" + child list with edit links
- [ ] **P1** Non-ADMIN hits `/admin/*` → soft-redirects to `/dashboard`

## Phase 7 — Active dashboard (M7-A/B)

- [ ] **P0** ACTIVE merchant → real dashboard (header + metrics + quick actions + locations)
- [ ] **P0** Public URL displayed; Copy link button copies + flashes "Copied!"
- [ ] **P0** Metrics tiles populate (followers, active products, orders, rating)
- [ ] **P0** Quick action cards (Products / Settings / Team / Locations) all navigate correctly
- [ ] **P0** Celebration modal fires on first ACTIVE visit; localStorage flag prevents re-fire on refresh
- [ ] **P1** Locations anchor in quick action scrolls to the section

## Phase 8 — Settings page (M7-C)

- [ ] **P0** `/dashboard/settings` renders all 6 sections
- [ ] **P0** All wizard sections autosave correctly here too
- [ ] **P0** Banner replacement works
- [ ] **P0** Locations CRUD works
- [ ] **P1** Sticky section nav scroll-to-anchor works

## Phase 9 — Team management (M7-D)

- [ ] **P0** Owner sees `/dashboard/team` with team list + Invite button
- [ ] **P0** Invite teammate modal → POST → row appears pending
- [ ] **P0** 409 "already on team" → inline error
- [ ] **P1** 409 "invite already sent" → inline + "Find them in your team list →" pivot scrolls + highlights row
- [ ] **P0** Resend invite (single-tap) → row glows
- [ ] **P0** Deactivate / Reactivate active employee
- [ ] **P0** Remove confirmation modal: "Deactivate instead" pivot for accepted, simpler for pending
- [ ] **P1** Non-owner (active employee) viewing the team list → no action buttons

## Phase 10 — Invite recipient flow (M8)

- [ ] **P0** Land on `/invites/accept?token=<valid>` signed-out → branded card + Sign in / Register CTAs
- [ ] **P0** Click "Sign in to accept" → `/login?returnUrl=...` → after login → back to invite page → matching-email substate
- [ ] **P0** Click "Accept invitation" → form opens with employee number field → submit → "You're in!" → redirects to `/dashboard`
- [ ] **P0** Welcome screen renders ("You're set up at {storeDisplayName}") instead of onboarding
- [ ] **P0** Log out → log back in → still lands on welcome screen (cache + verification path)
- [ ] **P1** New user via invite: Register with prefilled email → check email → verify → returns to invite → matching → form → success
- [ ] **P1** Signed in with mismatched email → info banner + "Sign out and switch account" → returns post-login
- [ ] **P1** Invalid/expired token → "This invite is no longer valid" UI
- [ ] **P2** Deactivated employee logs in → cache prunes → onboarding picker with "Were you invited?" link

---

## Bugs found

Use this section to log issues as they surface. One bullet per bug — terse is fine.

Suggested shape:
- `[phase] symptom → repro steps → suspected file/line`

Example:
- `[Phase 5] Image upload spinner never resolves on slow network → upload 5MB JPG on throttled 3G → MediaUploader probably needs onError surfaced`

### Fixed during this pass
- `[Phase 1] Logout 200 but page hangs on Splash → race: clearAuth + router.push fired before logout fetch resolved, so cookie was still present when middleware bounced /login → /dashboard → fixed in components/logout-button.tsx by awaiting the fetch before clearing+redirecting`
- `[Phase 2] Onboarding submit succeeds, wizard then errors with "Something went wrong on our side" → Zod parse failure on /stores/me: backend serializes Decimal columns as JSON strings (e.g. totalRevenue: "0"), schema expected numbers → fixed in lib/schemas/store.ts by switching totalSales/totalRevenue/averageRating/followerCount to z.coerce.number()`
- `[Phase 3] Upload button throws "Cannot read properties of undefined (reading 'open')" → next-cloudinary v6's render-prop returns open as a function but it internally calls widget.open() without guarding; widget is undefined while the Cloudinary script is still loading → fixed in components/media-uploader.tsx: AutoOpener now also receives the widget instance from the render-prop and only invokes open() once widget is truthy. Effect re-runs when widget transitions from undefined to defined.`
- `[Phase 3] Cloudinary upload returned 400 "Upload preset must be whitelisted for unsigned uploads" → next-cloudinary v6 (@cloudinary-util/url-loader) silently drops uploadSignature when it's a string; only Function values are forwarded to the widget. Our Pattern A pre-computed string signature never reached Cloudinary, so the upload submitted unsigned and the preset (correctly configured as Signed) rejected → fixed in components/media-uploader.tsx by wrapping the pre-computed signature in a callback function: uploadSignature: (cb) => cb(signature.signature). Followup note: chunked video uploads will need a real per-chunk signatureEndpoint (backend change) when we wire product_video.`
- `[Phase 3] After callback fix: "A Cloudinary API Key is required for signed requests" → @cloudinary-util/url-loader reads cloudName + apiKey from config.cloud (not from options) when signed-mode is detected; our apiKey was in options.apiKey, and NEXT_PUBLIC_CLOUDINARY_API_KEY env isn't set (deliberately — backend hands us the apiKey per-signature) → fixed in components/media-uploader.tsx by passing config={{ cloud: { cloudName, apiKey } }} prop on CldUploadWidget, removing the redundant cloudName/apiKey from options.`
- `[Phase 3] After config fix: 401 Invalid Signature from Cloudinary → backend's stringToSign was missing source=uw, which the upload widget injects automatically and Cloudinary includes in verification → BACKEND fix: added source=uw to the sorted stringToSign. Frontend code unchanged. Contract doc + handoff written (docs/Api-frontend-contracts/uploads-module-api.md §"What gets signed", docs/backend-handoffs/uploads-source-uw-signature.md). RESOLVED — image uploads working.`
- `[Phase 3] Wizard Payout: bank account number field appears uneditable → MaskedBankAccount required clicking the small "Add" button before typing (confirm-on-edit pattern per spec §8). Affordance hidden, users miss it → fixed in components/ui/masked-bank-account.tsx: when value is empty, render a plain input directly (no Add button). First keystroke transitions into the existing draft+commit-on-blur flow. The masked + Edit pattern still applies once a value is set, which is where confirm-on-edit actually protects against accidental overwrites.`
- `[Phase 3] Wizard Payout: account number + branch code accepted letters → fields are numeric by definition (SA branch code = 6 digits, account number = digits only) → fixed by stripping non-digits in onChange + setting inputMode="numeric" + autoComplete="off". Applied in components/ui/masked-bank-account.tsx (account number) and components/wizard/sections/payout.tsx (branch code Controller). Mobile keyboards now surface the numeric pad; paste with spaces/dashes/letters silently sanitises to digits.`
- `[Phase 4 / M9] Banner video upload succeeds, then CldImage 404s with "Resource not found" → next-cloudinary's CldImage treats a video secure_url as an image asset by default and constructs an /image/upload/ URL that doesn't exist. Frame extraction needs explicit assetType="video" so it routes through the video pipeline → fixed in components/approved/banner-media-item.tsx, components/approved/delete-banner-media-modal.tsx, and components/admin/review-go-live-detail.tsx (both BannerCover and BannerThumb). All three M9 video-frame renders now pass assetType="video" alongside videoFrameAtSecond().`
- `[Phase 4] Address form lacked a Suburb input (common SA address component) → added optional 'suburb' field to address schema + create/update bodies, form modal (between buildingName and city/postal row), display card, and contract docs. Backend needs to add a nullable suburb column + accept the field — handoff at docs/backend-handoffs/store-address-suburb.md.`
- `[Phase 5] Create product returns 201 but UI shows "Something went wrong" → two issues, both in lib/schemas/product.ts: (a) Decimal columns (averageRating, lengthCm/widthCm/heightCm) serialize as strings — switched to z.coerce.number(). (b) Backend's POST /products response omits the embedded relations (images, variants, categories, tags, collections) since a fresh product has none, but the schema required them → defaulted each to z.array(...).default([]) so the schema accepts both the create-response shape and the GET-detail shape. Minor backend inconsistency worth noting: POST should ideally return empty arrays for consistency with GET /products/:id, but the frontend default makes it moot.`
- `[Cross-cutting] Page scroll occasionally gets stuck "locked" after closing a modal; full reload was the only recovery → 19 modals each had their own inline document.body.style.overflow lock/restore, fragile under modal overlap / route changes / React 19 strict-mode double-mount → fixed with a centralized lib/use-body-scroll-lock.ts hook using a module-level counter (only the first acquire saves the original overflow + locks; only the last release restores). All 19 modal files migrated via batch script. Robust across stacked modals + dev double-invocation. Follow-up fix: also wired into media-uploader.tsx SignedWidget so Cloudinary's own body lock leaks get covered by our counter.`
- `[Phase 9] Employee invite email link 404s → backend email template points to /employees/invite?token=..., but the canonical frontend route per spec is /invites/accept?token=... → fixed via redirect shim at app/employees/invite/page.tsx that forwards the token to the correct route. Backend handoff written (docs/backend-handoffs/employee-invite-email-url.md) — one-line template change to land properly. Shim stays as a defensive backstop forever.`
- `[Phase 5 / Feature add] Product editor only supported images, not videos → wired video uploads through the existing product_video Cloudinary preset. Changes in components/products/sections/images-section.tsx (header renamed Images → Media, dual + Add image / + Add video buttons, MediaCard renders video frame + ▶ Play overlay via assetType="video", isLastImageOnActive filters by mediaType so videos delete freely) and components/products/delete-image-modal.tsx (conditional video thumb + copy). Constraints kept conservative: ≥1 image required for activation (videos do not count, already enforced in activation-readiness-panel:160), primary stays image-only in v1 because productListItemSchema response lacks mediaType — relaxing this needs a backend tweak.`
