# Yonder Experiences

Built and maintained by Dev Deepak. This site compares the value of current Yonder experiences and lets the community add offers from app screenshots. It was forked from [Dan Billson's original repository](https://github.com/danbillson/yonder-experiences).

## Tools

- Next.js 15
- Tailwind
- shadcn/ui
- recharts
- ultracite

## Contributing

Contributions to [Dev Deepak's repository](https://github.com/devd030703/yonder-experiences) are welcome through pull requests.

_Original sample data_

The original sample data is located in `src/lib/experiences.ts`. The new community flow below is used for current submissions.

## Community screenshot uploads

Visitors can upload a Yonder app screenshot without filling in a form. The image is sent to the server for OCR, processed in memory and not stored. The server extracts the experience name, selected points and pound value, earn rate and expiry, and checks that the displayed spend and earned points agree. A valid offer is saved to a **private Vercel Blob store** and appears immediately in the community list. Duplicate screenshots do not create duplicate entries.

The app infers the expiry year from the upload date in London. An expiry date that has already passed is rejected. Only the selected redemption tier's point cost is known from this screenshot layout; the other tiers are not guessed. Reports are saved under `reports/` in the private Blob store. The owner can open `/admin` to review reports and hide, correct or restore entries.

Set `BLOB_READ_WRITE_TOKEN` for the private Blob store and `ADMIN_PASSWORD` for owner review. The owner signs in with username `owner` and the configured password. Uploads are limited to eight and reports to twenty per IP per hour using private Blob markers. Screenshots must be JPG, PNG or WebP and under 4 MB. The checks validate the displayed numbers, but a convincing altered screenshot could still pass; the owner review page is the correction path.
