# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Roadmap
- Implement money.min.js for dynamic currency conversion
- Add multi-currency support (AUD, NZD, GBP, EUR, ZAR, PEN) with locale-based formatting.
- Implement a calendar-style date picker for the dashboard filter.
- Change the default landing page to 'Upload' for a better new user onboarding experience.
- Rework the logic and visualization for the 'Weekday vs. Weekend' spending analysis for greater clarity.
- Introduce a mechanism to handle purchases made directly from savings accounts/envelopes.
- Redesign the 'Savings Goal' modal to be more responsive and avoid overflow on smaller screens.
- Add the ability to edit the 'Payee' and 'Description' fields directly within the transaction table.
- Migrate all data visualizations from Recharts to Apache ECharts for improved performance and features.
- Save to Google drive functionality
- Add donation / buy me a coffee functionality
- Add page visit counter
- Fix Button widths when viewing on mobile devices
- Fix left to right scrolling on transactions page when viewing on mobile devices

## [0.8.0] - 2025-08-11

### Added
- **Advanced Transaction Table:** Replaced the basic transaction list with a powerful data grid powered by TanStack Table.
- **Monthly Pagination:** Added 'Prev/Next Month' controls and a direct month/year dropdown for easy date navigation.
- **Row Selection & Bulk Actions:** Integrated checkboxes for selecting multiple rows to enable bulk deletion with a confirmation modal.
- **View Customization:**
    - Added a 'Columns' pop-up to allow users to show/hide table columns.
    - Enabled column resizing by dragging header dividers.
    - Implemented intuitive column reordering via up/down arrows in the 'Columns' pop-up.
- **In-App Changelog Viewer:** Added a button on the Settings page to open a modal that displays the project's changelog, rendered from a markdown file.
- **Page Visit Counter:** Implemented a privacy-friendly visit counter on the Settings page using an external API to track application usage.

### Changed
- **Major Refactor:** The entire 'Transactions' page was refactored to use the TanStack Table library, replacing the previous manual implementation.
- **Streamlined UI:** The separate Year and Month filters were consolidated into a single, more compact dropdown selector.
- **Improved Modal Responsiveness:** The new changelog modal is now wider on desktop screens for better readability.

### Fixed
- **Dropdown Clipping:** Resolved an issue where the category selector dropdown was cut off by the table's scroll container.
- **Column Initialization:** Corrected bugs where the transaction table columns would load in the wrong order and the 'Columns' pop-up would not display correctly.
- **Layout:** Reduced the default width of the selection checkbox column for a more compact UI.

## [0.7.0] - 2025-07-19

### Added
- **New Dashboard Widget:** 'Income to Envelope Breakdown' card to visualize how income is allocated across spending and saving goals.
- **Multiple Chart Views:** The Income Breakdown widget includes three chart types: Pie, Focus (donut), and Radar.
- **New Dashboard Widget:** 'Weekday vs. Weekend Spending' analysis card, which is active in the 'Week' view.
- **Multiple Analysis Views:** The spending analysis widget features a toggle for 'Focus' charts and 'Gauge' progress bars.
- **Dashboard Customization:** Added a 'Customize' modal to allow users to toggle the visibility of all widgets, with preferences saved locally.

### Fixed
- **Chart Accuracy:** Corrected percentage calculations in the Income Breakdown chart tooltip to be relative to total income.
- **Application Stability:** Resolved a crash that occurred when hovering over a pie slice in the Weekday vs. Weekend chart.

## [0.6.0] - 2025-07-18

### Changed
- **Reworked Savings Goals:** Refactored 'Savings Goals' to function as recurring 'Monthly Contribution Goals' with an optional 'Final Target Sum' for definitive goals.
- **Improved Goal Tracking:** The dashboard now displays dual progress indicators for goals: progress against the monthly contribution and overall progress towards the final target.
- **Updated Management UI:** The envelope creation modal was updated with clearer labels and fields to support the new goal structure.

### Added
- **Onboarding Guide:** Added a "How It Works" flowchart to the 'Upload' page to visually guide new users.
- **Privacy Notice:** Added a prominent "Note on Your Privacy" section to the 'Upload' page to clearly communicate that all data is stored locally.

## [0.5.0] - 2025-07-16

### Added
- **Initial functional beta release of Spendyy.**
- **Core Features:**
    - Interactive Dashboard with charts for key insights and spending breakdowns.
    - Transaction list with manual add/edit/delete.
    - Category and Envelope management.
    - CSV file upload with column mapping.
    - Data persistence via browser `localStorage`.
    - Settings page for data backup, restore, and reset.
- **AI Integration:** Optional AI-powered category suggestions for individual transactions using Google Gemini.
- **Project Setup:** Initialized the project with Vite for local development and production builds.