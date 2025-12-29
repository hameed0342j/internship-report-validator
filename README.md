# Internship Report Validator 📄✅

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![React](https://img.shields.io/badge/React-19-61dafb.svg) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-06b6d4.svg)

A powerful, automated tool designed to validate internship reports against strict academic formatting guidelines. This application processes PDF documents client-side to ensure compliance with structure, layout, and content requirements before submission.

## ✨ Features

### 🔍 intelligent Structure Analysis
Automatically detects and validates the presence and order of required report sections:
- **Cover Page** (Checks for Title, Student Name, Degree, Department)
- **Bonafide Certificate**
- **Internship Certificate**
- **Viva Voce**
- **Acknowledgement**
- **Table of Contents** & **Abstract**
- **Chapters** (Introduction, etc.)

### 📐 Precision Layout Checking
Ensures your document meets the strict formatting standards:
*   **Font Size Verification**: Validates that Main Headings are strictly larger (14pt+) than body text.
*   **Margin Compliance**: Checks that content is within the specified safe zones (50 units).
*   **Alignment Checks**: Verifies that main headings are perfectly centered (within 20 units tolerance).
*   **Top-of-Page Rules**: Ensures Chapter headings start at the very top of the page.

### 📊 Scoring & feedback
*   **Weighted Scoring System**:
    *   **40%** Structure Match
    *   **40%** Layout Correctness
    *   **20%** Formatting Consistency
*   Provides detailed, actionable feedback for every error found.

### 🔒 Privacy-First
*   **100% Client-Side**: All processing happens in your browser using `pdfjs-dist`.
*   **No Uploads**: Your files never leave your computer.

## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS v4, Radix UI, DaisyUI 5
*   **Icons**: Lucide React
*   **PDF Processing**: PDF.js (`pdfjs-dist`), `react-pdf`
*   **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites
*   Node.js (Latest LTS recommended)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/hameed0342j/internship-report-validator.git
    cd internship-report-validator
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 📂 Project Structure

```bash
src/
├── components/       # UI Components (FileUpload, PDFPreview, ResultsView)
├── services/         # Core Logic
│   ├── rules.ts      # Validation Rules & Regex Patterns
│   ├── validator.ts  # Orchestration of validation checks
│   ├── pdf-analyzer.ts # PDF Text & Layout Extraction
│   └── watermark-detector.ts # Watermark analysis
├── lib/              # Utilities (shadcn/ui helpers)
└── App.tsx           # Main Application Entry
```

## 📝 Configuration

You can customize the validation rules in `src/services/rules.ts`.

```typescript
export const REPORT_RULES = {
    layout: {
        mainHeading: {
            fontSizeThreshold: 14,
            topMarginThreshold: 150,
        },
        centeringTolerance: 20,
    },
    // ...
};
```

---
Made with ❤️ for efficiency.
