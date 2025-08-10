# Spendyy - Private, Local-First Budget Tracker

Spendyy is a powerful budget analysis tool designed to be as private as you desire. It helps you track historical spending, manage custom categories, and measure progress against your financial goals—all while keeping your data securely on your own device.

**Your Data, Your Control:**
Spendyy runs entirely in your browser. All transaction data, categories, and settings are stored locally using your browser's `localStorage`. **Nothing is ever sent to a remote server unless you use the AI categorization.** This means you have complete control and ownership of your financial information. You can even watch your local data file grow as you add transactions and delete it completely at any time.

**AI-Assist for Easy Organization:**
To make categorizing transactions effortless, Spendyy includes an optional AI-assist feature powered by the Google Gemini API. This is an on-demand tool; your anonymized transaction details (payee and description) are only sent to the API when you explicitly ask for a suggestion. You can disable this feature entirely and manage your API key in the settings.

---

## 📸 Screenshots

**Dashboard View**
*Pending*

**Transactions Management**
*Pending*

**CSV Upload & Mapping**
*Pending*

**Mobile View**
*Pending*

---

## ✨ Key Features

*   **📊 Interactive Dashboard:** Get a clear overview of your finances with stats for income, expenses, and net savings. Filter your view by day, week, month, or year.
*   **📈 Visual Reports:**
    *   **Spending by Category:** A dynamic pie chart to see where your money goes.
    *   **Spending Trends:** A bar chart to track spending patterns over time, with options to group by total, category, or envelope.
*   **✉️ Envelope Budgeting:**
    *   **Spending Pools:** Set monthly budgets for categories like "Groceries" or "Dining Out".
    *   **Saving Goals:** Track your progress towards goals like "Vacation Fund" or "New Laptop".
*   **🤖 AI-Powered Categorization:**
    *   **Smart Suggestions:** Get single-click category suggestions for uncategorized transactions.
    *   **Batch AI Assist:** Let the AI categorize all your uncategorized transactions in one go.
    *   Powered by Google's `gemini-2.5-flash` for fast and accurate results.
*   **🧾 Robust Transaction Management:**
    *   **Advanced Data Grid:** A powerful, sortable, and filterable transaction table powered by TanStack Table.
    *   **Monthly Pagination:** Easily navigate through your history month by month or jump directly to a specific date.
    *   **Bulk Actions:** Select multiple transactions to delete them all at once.
    *   **Customizable View:** Resize, reorder, and hide columns to create your perfect layout.
    *   Manually add, edit, and delete individual transactions.
    *   Easily split transaction amounts (e.g., when you've paid for a shared meal).
*   **⬆️ Flexible Data Import:**
    *   Upload CSV files from your bank.
    *   An intuitive mapping interface to match your file's columns to Spendyy's fields.
    *   Smart parsing of amounts (handles positive/negative values automatically).
*   **📂 Data Portability:**
    *   **Export to CSV:** Download your transaction data for any year, or all-time, for use in other applications.
    *   **Backup & Restore:** Create a full JSON backup of all your data (transactions, categories, envelopes, settings) and restore from it at any time.
*   **⚙️ Customization & Control:**
    *   Create and manage your own spending categories with custom names and colors.
    *   Mark categories as "Transfers" to exclude them from expense reports.
    *   Configure AI settings, including enabling/disabling features and managing your API key.
*   **🔒 Privacy First:** All your financial data is stored locally in your browser's `localStorage`. Nothing is ever sent to a server, except for the anonymized transaction details sent to the Gemini API for categorization suggestions (and only when you explicitly ask for it).
*   **📱 Responsive Design:** A clean, modern UI that works beautifully on both desktop and mobile devices.

---

## 🛠️ Technology Stack

*   **Frontend:** React & TypeScript
*   **Data Tables:** TanStack Table
*   **AI Integration:** Google Gemini API (`@google/genai`)
*   **Styling:** Tailwind CSS
*   **Animations:** Framer Motion
*   **Charting:** Recharts
*   **CSV Parsing:** Papaparse

---

## 🚀 Getting Started

This project is built with Vite and React. It requires Node.js and npm to run locally.

### Demo

A live version of the application is available for demonstration at:
**[https://nospendyy.netlify.app](https://nospendyy.netlify.app)**

### Prerequisites

*   [Node.js](https://nodejs.org/) (which includes npm) version 18.x or higher.
*   (Optional) A Google Gemini API Key if you wish to use the AI features. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).


### Configuration (API Key)

The AI features require a Google Gemini API key. There are two ways to provide it:

**1. Through the User Interface (Recommended for most users)**

The easiest way to use the AI features is to add your API key directly within the application:

1.  Go to the **Settings** tab.
2.  In the **AI Settings** section, paste your API key into the input field.
3.  Click **"Test & Save Settings"**.

The key is stored securely in your browser's `localStorage` and will be used for all future sessions on that device. This is the recommended method when using the live demo or a pre-built version of the app.

**2. Using an Environment File (For developers and self-hosting)**

If you are running the project from the source code or hosting your own version, you can set a *default* API key that will be bundled with the application. This is useful for private deployments where you want the key to be pre-configured for all users of your instance.

1.  In the project's root directory, create a file named `.env`.
2.  Add your API key to this file:
    ```env
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
This key will be the default for anyone using your build. Users can still override it by entering their own key in the Settings page UI. The `.env` file is listed in `.gitignore` to prevent accidentally committing your secret key to version control.


### Running Locally

1.  Open your terminal and navigate to the project's root directory.
2.  Install the required dependencies:
    ```bash
    npm install
    ```
3.  Start the local development server:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to the URL provided in the terminal (usually `http://localhost:5173`). The app will now be running with hot-reloading.

### Building for Production

To create an optimized static build of the application:

1.  Run the build command:
    ```bash
    npm run build
    ```
2.  The output files will be generated in the `dist` directory. You can deploy this directory to any static web hosting service.
---

## 🤝 Contributing

If you have suggestions for improvements or find a bug, please feel free to open an issue or submit a pull request.

---

## 📜 License

This project is open-source and available under the MIT License.
