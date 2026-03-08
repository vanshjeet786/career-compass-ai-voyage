

## Fix: Remove "Update Profile" Button from Results Page

The "Update Profile" button on the Results page just links to `/profile` — redundant since the navbar already has that link. Will remove it and keep only the "Retake Assessment" button.

### Change
**`src/pages/Results.tsx`** — Remove the "Update Profile" `<Button>` from the bottom actions card.

