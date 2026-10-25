# KindRoute

A local React + Tailwind CSS prototype connecting surplus resources with community needs.

The homepage is an animated editorial landing page with switchable donation categories, an interactive journey preview, and separate donor/NGO entry points. Use **Go to dashboard** to explore the demo, or open `/#dashboard` directly. The dashboard logo returns to the homepage. Small text across the application has been enlarged for readability.

The donor Overview is deliberately compact: three counts from the donor’s own listings, one next-pickup notice, and a recent-donations list. Donation search, map tracking, NGO community cards, and rewards are kept on their dedicated pages.

## Run locally

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. Create a production build with `npm run build`; serve it with `npm run preview`.

With the dev server running on port 5173, run `npm run test:e2e` for the browser workflow check. It uses installed Microsoft Edge by default; set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome. Screenshots and the test certificate are saved to the ignored `artifacts/` folder.

## Try the complete flow

1. Choose **Go to dashboard** from the landing page, then **Make a donation**.
2. Add an item, category, quantity, pickup address, date, and condition details.
3. Choose **Switch to NGO workspace** in the footer. Select **Try the NGO demo instead**, or register a browser-local NGO profile.
4. Browse donations, open an available item, and reserve it.
5. Open **Reserved pickups**, choose your reservation, and click **Track pickup**, then **Simulate live pickup**.
6. Once the simulated driver arrives, choose **Verify delivered**.
7. Return to the donor workspace and view **Rewards & impact** to download a certificate.

The NGO workspace has a separate, operational dashboard: **Overview**, **Explore donations**, **Reserved pickups**, and **Collection history**. Summary counts come from actual local listings. Available listings can be searched and filtered by category; reservations and completed collections are scoped to the organisation name. An NGO can release a reservation to make the donation available again. Rewards, certificates, and requirement posting are not part of the NGO workspace. Donor community cards retain the illustrative NGO needs.

## Project structure

- `src/App.jsx`: application state, dashboards, forms, and donation workflows.
- `src/components/`: reusable brand, badges, dialogs, and Leaflet pickup map.
- `src/components/NgoDashboard.jsx`: dedicated NGO collection workspace and organisation-specific views.
- `src/ngo.css`: responsive layout and styling for the NGO workspace.
- `src/hooks/`: browser-persistent state hook.
- `src/data.js`: sample donations, categories, and community requirements.
- `src/styles.css`: Tailwind theme, responsive component styles, and motion.
- `src/main.jsx`: React entry point.

## Frontend demo boundaries

- Profiles and donations use `localStorage`. They persist on this browser and origin; they are not shared between devices or other browsers. NGO reservations are associated with the organisation name; production use would require stable account IDs.
- Registration is a local profile, without passwords or server authentication. Sample NGO badges are illustrative, not a verification service.
- Sample dashboard totals include historical demo activity. Detailed impact counts use delivered listings, with illustrative assumptions of 25 people and 5 kg per donation.
- A delivered donation earns 120 kindness points. The Heart of Gold milestone unlocks at 1,500 points. Certificates download as SVG files and are labeled as demo certificates.
- Driver movement follows a predefined route on a real Leaflet map. It is a simulation, not live driver GPS or road-based route optimisation. **Use my GPS** updates the map to the current browser location, subject to permission and secure-context requirements.
- OpenStreetMap tiles, Unsplash sample imagery and Google Fonts require internet access. The application logic and saved data run locally. Local image assets and a tile strategy would be needed for full offline support.
- Food safety, real pickup confirmations, NGO validation, notifications, accounts and multi-user coordination need a backend before production use.

To reset the demo, clear the three `kindroute-*` keys in browser local storage.
