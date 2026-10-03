# Yonder Experiences

This is a simple app to visualise the value per points for different experiences through the Yonder credit card

## Tools

- Next.js 15
- Tailwind
- shadcn/ui
- recharts
- ultracite

## Contributing

Feel free to contribute to this repo by forking your own version and creating a pull request back into this one, happy to accept updates for data or any other improvements

_Original sample data_

The original sample data is located in `src/lib/experiences.ts`. The new community flow below is used for current submissions.

## Community screenshot prototype

Visitors can upload a Yonder app screenshot. OCR runs in the browser; the image is not sent to the server or stored. The server receives OCR text, extracts the experience name, selected points and pound value, earn rate and expiry, and checks that the displayed spend and earned points agree. A valid offer is saved to a **private Vercel Blob store** and appears immediately in the community list. Duplicate screenshots do not create duplicate entries. The original hardcoded entries remain available as unverified sample data.

The app infers the expiry year from the upload date in London. An expiry date that has already passed is rejected. Only the selected redemption tier's point cost is known from this screenshot layout; the other tiers are not guessed. Reports from the “Report incorrect entry” button are saved under `reports/` in the private Blob store for the project owner to review.

To run or deploy the prototype, connect a private Vercel Blob store and make `BLOB_READ_WRITE_TOKEN` available to the Next.js app. The public submission endpoint verifies OCR consistency but does not establish that an image came from Yonder, so add abuse controls before opening submissions to the public.
