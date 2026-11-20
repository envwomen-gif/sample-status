# sample-status

Read-only page that shows the paper sampling card (COST BREAKUP v6) filled from the **SAMPLE MASTER** Google Sheet.

- `/<JC>` shows the card for one JC. A JC with several colours gets one button per colour. `?c=B` opens colour B.
- `/pdf/<JC>` gives the blank card with a QR for that JC. Print this for each sample. The form itself is unchanged.
- Nothing can be edited here. People still fill the paper card and the sample form, and the sheet is the only data.

## Setup (Vercel env vars)
| Name | Value |
|---|---|
| `SHEET_ID` | ID of the SAMPLE MASTER spreadsheet |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service account JSON key. Share the sheet with its `client_email` as Viewer. |
| `PUBLIC_BASE_URL` | Optional. Site URL printed in the QR. Default: the host that serves `/pdf/<JC>`. |

The sheet is read by header name (row 3 of `SAMPLE MASTER`). A repeated header gets `@2` for the second copy, for example the cost table `Fabric 1 Type@2`. Do not rename headers.

## Files
`lib/render.js` draws the card. `lib/sheet.js` reads the sheet. `api/card.js` and `api/pdf.js` are the two routes.
