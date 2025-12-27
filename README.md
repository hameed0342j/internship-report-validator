# 📄 Internship Report Validator

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7.3-purple?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-4.0-cyan?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker">
</p>

An AI-powered PDF validation tool designed specifically for **B.S. Abdur Rahman Crescent Institute of Science and Technology** internship reports. Validates document structure, formatting, RRN watermarks, and provides detailed fix suggestions.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📋 **Structure Validation** | Checks cover page, certificates, TOC, abstract, all 11 chapters |
| 🔐 **RRN Watermark Detection** | Validates 12-digit registration numbers (230171601XXX format) |
| 📊 **Page Analysis** | Page-by-page justification with pattern matching |
| ✅ **Justification Check** | Verifies paragraph alignment (ignores headings) |
| 📑 **TOC Validation** | Cross-references page numbers with actual content |
| 📁 **Batch Processing** | Upload multiple PDFs, export results to CSV |
| 🌙 **Dark/Light Theme** | System-aware theme with manual toggle |
| 🐳 **Docker Ready** | One-command deployment |

---

## 🎯 Validation Checks

### Scoring Weights (100 points total)

| Category | Weight | Checks |
|----------|--------|--------|
| **Structure** | 35% | Cover, Bonafide, Certificate, Viva Voce, Acknowledgement, TOC, Abstract, Chapters |
| **Layout** | 25% | Centering, margins, heading positions, paragraph justification |
| **Watermark/RRN** | 20% | RRN format, watermark presence, college code verification |
| **Formatting** | 10% | Consistency across pages |
| **Page Count** | 10% | Minimum 30 pages required |

### Expected Report Structure

```
Page 1  → Cover Page (Project title, Student name, RRN, Degree)
Page 2  → Bonafide Certificate
Page 3  → Internship Certificate
Page 4  → Viva Voce Examination
Page 5  → Acknowledgement
Page 6  → Table of Contents
Page 7  → List of Abbreviations
Page 8  → List of Figures
Page 9  → List of Tables
Page 10 → Abstract
Page 11 → Chapter 1 - Company Profile
...
Page N  → Chapter 11 - Conclusion
```

---

## 📁 Project Structure

```
internship-report-validator/
├── 📄 index.html                 # Entry HTML
├── 📄 package.json               # Dependencies & scripts
├── 📄 vite.config.ts             # Vite configuration
├── 📄 tailwind.config.js         # Tailwind CSS config
├── 📄 tsconfig.json              # TypeScript config
├── 🐳 Dockerfile                 # Multi-stage Docker build
├── 🐳 nginx.conf                 # Nginx configuration
├── 📄 .dockerignore              # Docker ignore rules
│
├── 📂 src/
│   ├── 📄 App.tsx                # Root component
│   ├── 📄 main.tsx               # React entry point
│   ├── 📄 index.css              # Global styles (Tailwind)
│   │
│   ├── 📂 components/
│   │   ├── 📄 ReportValidator.tsx    # Main validator UI (tabs, results)
│   │   ├── 📄 FileUpload.tsx         # Drag & drop file upload
│   │   ├── 📄 BatchProcessor.tsx     # Multi-file batch processing
│   │   ├── 📄 PageAnalysisView.tsx   # Page-by-page analysis & fixes
│   │   ├── 📄 PDFPreview.tsx         # PDF viewer with zoom
│   │   ├── 📄 ResultsView.tsx        # Validation results display
│   │   ├── 📄 Header.tsx             # App header with theme toggle
│   │   ├── 📄 Footer.tsx             # App footer
│   │   ├── 📄 ThemeProvider.tsx      # Dark/light theme context
│   │   │
│   │   └── 📂 ui/                    # shadcn/ui components
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── separator.tsx
│   │       ├── skeleton.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── tooltip.tsx
│   │
│   ├── 📂 services/
│   │   ├── 📄 pdf-analyzer.ts        # PDF parsing & layout analysis
│   │   ├── 📄 validator.ts           # Core validation logic
│   │   ├── 📄 rules.ts               # Validation rules & patterns
│   │   ├── 📄 watermark-detector.ts  # RRN watermark detection
│   │   └── 📄 docx-analyzer.ts       # DOCX support (basic)
│   │
│   ├── 📂 types/
│   │   └── 📄 index.ts               # TypeScript interfaces
│   │
│   └── 📂 lib/
│       └── 📄 utils.ts               # Utility functions (cn)
│
└── 📂 public/
    └── vite.svg
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Pull and run
docker pull muhammedalhameed/internship-report-validator:latest
docker run -d -p 8080:80 muhammedalhameed/internship-report-validator:latest

# Open http://localhost:8080
```

### Option 2: From Source

```bash
# Clone repository
git clone https://github.com/hameed0342j/internship-report-validator.git
cd internship-report-validator

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 🐳 Docker Commands

```bash
# Build image locally
docker build -t internship-report-validator .

# Run container
docker run -d -p 8080:80 internship-report-validator

# Stop container
docker stop $(docker ps -q --filter ancestor=internship-report-validator)
```

---

## 📸 Screenshots

### Single File Validation
- Upload PDF → Get instant score
- View errors, warnings, and fix suggestions
- Page-by-page analysis with justification

### Batch Processing
- Upload multiple PDFs at once
- See aggregate statistics
- Export results to CSV

---

## 🔧 Configuration

### Validation Rules (`src/services/rules.ts`)

```typescript
export const REPORT_RULES = {
  institution: {
    name: 'B.S. Abdur Rahman Crescent Institute...',
    collegeCode: '17160',
  },
  rrn: {
    length: 12,
    pattern: /^(2[0-5])(17160|01716)(\d{4})$/,
  },
  pageStructure: [
    { page: 1, name: 'Cover Page', requiredPatterns: [...] },
    { page: 2, name: 'Bonafide Certificate', ... },
    // ... 11 page definitions
  ],
  scoring: {
    structureMatch: 35,
    watermarkValid: 20,
    layoutCorrectness: 25,
    formatting: 10,
    pageCount: 10,
  }
};
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1 | UI Framework |
| TypeScript | 5.6 | Type Safety |
| Vite | 7.3 | Build Tool |
| Tailwind CSS | 4.0 | Styling |
| shadcn/ui | - | UI Components |
| pdf.js | 5.4 | PDF Parsing |
| Sonner | - | Toast Notifications |
| Nginx | Alpine | Production Server |

---

## 📋 API Reference

### PDFAnalyzer

```typescript
const analyzer = new PDFAnalyzer();
const pages: AnalyzedPage[] = await analyzer.analyze(file);
```

### Validator

```typescript
const validator = new Validator();
const result: ValidationResult = validator.validate(pages, watermarkInfo, fileName);
```

### WatermarkDetector

```typescript
const detector = new WatermarkDetector();
const watermark: WatermarkInfo = await detector.detect(file);
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - feel free to use for educational purposes.

---

## 👥 Authors

- **Mohammed Al Hameed** - *Initial work* - B.S. Abdur Rahman Crescent Institute

---

## 🙏 Acknowledgments

- B.S. Abdur Rahman Crescent Institute of Science and Technology
- Department of AI & Data Science
- All students who provided sample reports for validation rule development

---

<p align="center">
  <b>Built with ❤️ for Crescent Institute Students</b>
</p>
