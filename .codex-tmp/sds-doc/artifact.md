# Template execution contract

## Reference

- Source: `C:\Users\ontri\Downloads\Template3_SDS Document.docx`
- SHA-256: `E3FABFAB5FBC716D9722622F91345ABEF99CA23381843906995822403CBDF6A7`
- Render baseline: 7 pages in `.codex-tmp/sds-doc/template-render/`
- Sections: 1
- Reference must remain unchanged; final output is a separate file in `docs/`.

## Page system

- US Letter portrait, 8.50 x 11.00 inches.
- Margins: left/right 1.00 in, top 0.82 in, bottom 0.81 in.
- Different first page enabled; cover has no visible page number.
- Subsequent pages use a thin gray footer rule and right-aligned `Page | n`.
- Header is empty. Footer distance and first-page behavior are inherited from the reference.

## Visual system

- Base typeface: Calibri.
- Cover: centered FPT University logo and university name, large dark-red project title and SDS subtitle, centered city/month/year near page bottom.
- Body: black Calibri; major section headings dark red; TOC title blue; tables use pale peach header fill and dark brown header text.
- Diagram and table captions are italic and kept with their objects.
- Preserve generous white space, thin black table borders, and the reference's restrained academic style.

## Recurring components

1. Cover page.
2. Record of Changes table.
3. Table of Contents.
4. Major numbered sections (`I.`, `II.`, appendices).
5. Subsections numbered by feature and lettered design artifacts.
6. Package/database/method tables with peach header row.
7. Full-width UML figures with numbered captions.
8. Footer rule and page number after the cover.

## Content flow and slot map

- Replace `<<Project name>>` with `UNI-MATE`.
- Replace cover date with `Ho Chi Minh City, July 2026`.
- Fill one record-of-change row for the implementation-derived SDS baseline.
- Replace the sample TOC with a generated Word TOC.
- Replace all blue instructional placeholder text and all sample diagrams/tables.
- Overview: purpose, scope, architecture, package diagram/description, design conventions.
- Database Design: MongoDB schema diagrams, collection descriptions, indexes and lifecycle notes.
- Code Designs: Authentication/Profile; Discovery/Matching; Cafe Proposal/Match; Private Chat/Notifications; Groups; Places/Partner/Vouchers; Safety/Moderation; Administration.
- Each feature contains responsibilities, class/component view, class/method specification, UML sequence diagram, and representative MongoDB/Mongoose operations.
- Appendices: REST/Socket interface inventory, state transitions, configuration/dependencies, known implementation discrepancies.

## Package preservation

- Preserve source branding image treatment, page geometry, base styles, footer semantics, and overall color language.
- The source's example images and placeholder text are editable/removable.
- Custom XML/content controls, sample bookmarks and stale PAGEREF fields are not semantically required for the completed document and may be replaced by native Word headings/TOC fields.
- Keep the source file byte-for-byte unchanged.

## Fidelity gates

- The final cover remains recognizably derived from the FPT template.
- Page geometry and margins remain unchanged.
- Major heading, table, footer and figure treatments remain consistent with the reference.
- Every placeholder/sample is removed.
- All diagrams are readable at 100% zoom and each caption stays with its figure.
- Tables do not clip and repeat header rows where they span pages.
- TOC and page-number fields are refreshed by Microsoft Word before final render.
