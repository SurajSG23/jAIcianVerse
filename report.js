const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TableOfContents, UnderlineType
} = require('docx');
const fs = require('fs');

// ─── Page geometry (A4, per guidelines) ──────────────────────────────────────
// Left 1.25" = 1800, Right 1" = 1440, Top 0.75" = 1080, Bottom 0.75" = 1080
// Content width = 11906 - 1800 - 1440 = 8666 DXA
const CONTENT_W = 8666;
const PAGE = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1080, bottom: 1080, left: 1800, right: 1440 }
};

// ─── Typography helpers ───────────────────────────────────────────────────────
const TNR = 'Times New Roman';

const body = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 360, before: 0, after: 160 }, // 1.5 line spacing
  children: [new TextRun({ text, font: TNR, size: 24, ...opts })]
});

const bodyPara = (runs, opts = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { line: 360, before: 0, after: 160 },
  children: runs,
  ...opts
});

const run = (text, opts = {}) => new TextRun({ text, font: TNR, size: 24, ...opts });
const runBold = (text) => run(text, { bold: true });
const runItalic = (text) => run(text, { italics: true });
const cite = (n) => run(`[${n}]`, { bold: false, size: 22 });

const ch = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  alignment: AlignmentType.CENTER,
  spacing: { before: 480, after: 320 },
  children: [new TextRun({ text, font: TNR, size: 32, bold: true })]
});

const sec = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 360, after: 200 },
  children: [new TextRun({ text, font: TNR, size: 28, bold: true })]
});

const subsec = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 280, after: 160 },
  children: [new TextRun({ text, font: TNR, size: 24, bold: true })]
});

const subsubsec = (text) => new Paragraph({
  spacing: { before: 200, after: 120 },
  children: [new TextRun({ text, font: TNR, size: 24, bold: true, underline: { type: UnderlineType.SINGLE } })]
});

const blankLine = () => new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun('')] });

const bullet = (text, opts = {}) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  spacing: { line: 360, before: 60, after: 60 },
  children: [new TextRun({ text, font: TNR, size: 24, ...opts })]
});

const bulletRuns = (runs) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  spacing: { line: 360, before: 60, after: 60 },
  children: runs
});

const numbered = (text) => new Paragraph({
  numbering: { reference: 'numbers', level: 0 },
  spacing: { line: 360, before: 60, after: 60 },
  children: [new TextRun({ text, font: TNR, size: 24 })]
});

const centered = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 120 },
  children: [new TextRun({ text, font: TNR, size: 24, ...opts })]
});

const centeredLarge = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 160, after: 160 },
  children: [new TextRun({ text, font: TNR, size: 28, bold: true, ...opts })]
});

// ─── Table helpers ────────────────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };
const margins = { top: 80, bottom: 80, left: 120, right: 120 };

const hdrCell = (text, w) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA }, margins,
  shading: { fill: 'D9D9D9', type: ShadingType.CLEAR },
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: TNR, size: 22, bold: true })] })]
});

const cell = (text, w, center = false) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA }, margins,
  children: [new Paragraph({ alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text, font: TNR, size: 22 })] })]
});

const cellRuns = (runs, w) => new TableCell({
  borders, width: { size: w, type: WidthType.DXA }, margins,
  children: [new Paragraph({ alignment: AlignmentType.LEFT, children: runs })]
});

const tableRow = (cells) => new TableRow({ children: cells });
const makeTable = (rows, widths) => new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: widths,
  rows
});

const figCaption = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 240 },
  children: [new TextRun({ text, font: TNR, size: 22, bold: true, italics: true })]
});

const tableCaption = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, font: TNR, size: 22, bold: true })]
});

// ─── Page break utility ───────────────────────────────────────────────────────
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ════════════════════════════════════════════════════════════════════════════

// ── TITLE PAGE ───────────────────────────────────────────────────────────────
const titlePage = [
  blankLine(), blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 }, children: [new TextRun({ text: 'JSS MAHAVIDYAPEETHA', font: TNR, size: 32, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: 'JSS Science and Technology University', font: TNR, size: 28, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: 'Department of Computer Science and Engineering', font: TNR, size: 24, bold: true })] }),
  blankLine(), blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 }, children: [new TextRun({ text: '"jAIcianVerse – AI-Powered Academic Collaboration and Tutoring Platform"', font: TNR, size: 28, bold: true, italics: true })] }),
  blankLine(),
  centered('A technical project report submitted in partial fulfillment of the award of the degree of'),
  blankLine(),
  centeredLarge('BACHELOR OF ENGINEERING IN'),
  centeredLarge('COMPUTER SCIENCE & ENGINEERING'),
  blankLine(), blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80 }, children: [new TextRun({ text: 'BY', font: TNR, size: 24, bold: true })] }),
  blankLine(),
  makeTable([
    tableRow([cell('(Student Name 1)', 4333), cell('(USN 1)', 4333)]),
    tableRow([cell('(Student Name 2)', 4333), cell('(USN 2)', 4333)]),
    tableRow([cell('(Student Name 3)', 4333), cell('(USN 3)', 4333)]),
    tableRow([cell('(Student Name 4)', 4333), cell('(USN 4)', 4333)]),
  ], [4333, 4333]),
  blankLine(), blankLine(),
  centered('Under the Guidance of'),
  blankLine(),
  centeredLarge('(Guide Name / Designation)'),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: 'Assistant / Associate Professor', font: TNR, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: 'Department of Computer Science & Engineering', font: TNR, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: 'JSS STU Mysore', font: TNR, size: 24 })] }),
  blankLine(), blankLine(),
  centered('2024–25'),
];

// ── CERTIFICATE ───────────────────────────────────────────────────────────────
const certificatePage = [
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'JSS MAHAVIDYAPEETHA', font: TNR, size: 32, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: 'JSS Science and Technology University', font: TNR, size: 28, bold: true })] }),
  blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: 'CERTIFICATE', font: TNR, size: 32, bold: true, underline: { type: UnderlineType.SINGLE } })] }),
  blankLine(),
  body('This is to certify that the work entitled "jAIcianVerse – AI-Powered Academic Collaboration and Tutoring Platform" is a bonafide work carried out by (Student Name 1), (Student Name 2), (Student Name 3), and (Student Name 4) in partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering in Computer Science and Engineering by JSS Science and Technology University, Mysuru, during the academic year 2024–2025. The project report has been approved as it satisfies the academic requirements in respect of project work prescribed for the Bachelor of Engineering degree.'),
  blankLine(), blankLine(), blankLine(),
  makeTable([
    tableRow([
      cell('Under the Guidance of', 2888),
      cell('', 500),
      cell('Head of the Department', 2888),
      cell('', 500),
      cell('Principal', 1890),
    ]),
    tableRow([
      cell('(Guide Name)', 2888), cell('', 500),
      cell('Dr. (HOD Name)', 2888), cell('', 500),
      cell('(Principal Name)', 1890),
    ]),
    tableRow([
      cell('Designation', 2888), cell('', 500),
      cell('Assoc. Prof. and HOD', 2888), cell('', 500),
      cell('Professor', 1890),
    ]),
    tableRow([
      cell('Dept. of CS & E', 2888), cell('', 500),
      cell('Dept. of CS & E', 2888), cell('', 500),
      cell('JSS STU Mysore', 1890),
    ]),
    tableRow([
      cell('JSS STU Mysore – 06', 2888), cell('', 500),
      cell('JSS STU Mysore – 06', 2888), cell('', 500),
      cell('', 1890),
    ]),
  ], [2888, 500, 2888, 500, 1890]),
  blankLine(), blankLine(),
  body('Name of Examiners:\t\tSignature with Date'),
  body('1. ________________________\t\t_______________________'),
  body('2. ________________________\t\t_______________________'),
];

// ── PLAGIARISM CERTIFICATE ────────────────────────────────────────────────────
const plagiarismPage = [
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'JSS MAHAVIDYAPEETHA', font: TNR, size: 32, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: 'JSS Science and Technology University', font: TNR, size: 28, bold: true })] }),
  blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: 'CERTIFICATE OF PLAGIARISM CHECK', font: TNR, size: 32, bold: true, underline: { type: UnderlineType.SINGLE } })] }),
  blankLine(),
  body('This is to certify that the project report entitled "jAIcianVerse – AI-Powered Academic Collaboration and Tutoring Platform" has been evaluated using the Turnitin plagiarism-checking tool and is reported to have a similarity index of _______ %, which is below the university agreed norms (less than 20%).'),
  blankLine(),
  bodyPara([runBold('Tool Used: '), run('Turnitin / iThenticate')]),
  bodyPara([runBold('Similarity Index: '), run('_______ %')]),
  bodyPara([runBold('Permissible Limit: '), run('< 20%')]),
  blankLine(), blankLine(),
  body('Guide Signature: _______________________'),
  body('Name: (Guide Name)'),
  body('Date: _______________________'),
];

// ── DECLARATION ───────────────────────────────────────────────────────────────
const declarationPage = [
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'DECLARATION', font: TNR, size: 32, bold: true, underline: { type: UnderlineType.SINGLE } })] }),
  blankLine(),
  body('We hereby declare that the project entitled "jAIcianVerse – AI-Powered Academic Collaboration and Tutoring Platform" has been carried out by us under the guidance of (Guide Name / Designation), Department of Computer Science and Engineering, JSS Science and Technology University, Mysuru, in partial fulfillment of the requirements for the award of the Bachelor of Engineering degree during the academic year 2024–2025.'),
  blankLine(),
  body('We further declare that this project work has not been submitted to any other university or institution for the award of any degree or diploma. All sources used in this work have been duly acknowledged, and the content is entirely original.'),
  blankLine(), blankLine(),
  body('Date: _______________________'),
  body('Place: Mysore'),
  blankLine(), blankLine(),
  body('(Student Name 1)\t\t\t\t(USN 1)'),
  body('(Student Name 2)\t\t\t\t(USN 2)'),
  body('(Student Name 3)\t\t\t\t(USN 3)'),
  body('(Student Name 4)\t\t\t\t(USN 4)'),
];

// ── ACKNOWLEDGEMENT ───────────────────────────────────────────────────────────
const acknowledgementPage = [
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'ACKNOWLEDGEMENT', font: TNR, size: 32, bold: true, underline: { type: UnderlineType.SINGLE } })] }),
  blankLine(),
  body('We take this opportunity to express our heartfelt gratitude to all those who extended their invaluable support and guidance throughout the development of this project.'),
  blankLine(),
  body('First and foremost, we are sincerely thankful to our project guide, (Guide Name / Designation), for the consistent supervision, insightful feedback, and patient mentoring provided at every stage of this work. The guidance offered by our guide helped shape both the technical direction and the quality of this report.'),
  blankLine(),
  body('We extend our thanks to Dr. (HOD Name), Head of the Department of Computer Science and Engineering, for creating an environment that encourages technical exploration and research-oriented thinking. The department has provided excellent infrastructure and academic resources that made this project feasible.'),
  blankLine(),
  body('We are grateful to the faculty members of the Department of Computer Science and Engineering, JSS Science and Technology University, for their teaching, review discussions, and suggestions during project reviews. Their perspectives helped us identify gaps and improve the system progressively.'),
  blankLine(),
  body('We also acknowledge the broader open-source community behind the tools and frameworks used in this project — React, Node.js, MongoDB, Socket.io, Ollama, Unsloth, and the HuggingFace ecosystem — without whose contributions building a project of this scope would not have been possible in an academic setting.'),
  blankLine(),
  body('Finally, we thank our classmates, family members, and well-wishers for their encouragement and understanding throughout this journey.'),
  blankLine(), blankLine(),
  body('(Student Name 1), (Student Name 2), (Student Name 3), (Student Name 4)'),
  body('Department of Computer Science and Engineering'),
  body('JSS Science and Technology University, Mysuru'),
  body('Academic Year: 2024–25'),
];

// ── ABSTRACT ─────────────────────────────────────────────────────────────────
const abstractPage = [
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'ABSTRACT', font: TNR, size: 32, bold: true, underline: { type: UnderlineType.SINGLE } })] }),
  blankLine(),
  body('The rapid growth of digital education tools has created a landscape where students and educators are often spread across multiple disconnected platforms — one application for notes, another for chat, another for doubt-solving, and yet another for academic AI assistance. This fragmentation hinders learning continuity and makes it harder to maintain a coherent academic workflow.'),
  blankLine(),
  body('jAIcianVerse is a full-stack academic support platform developed to address this fragmentation by integrating structured learning modules, real-time collaboration features, and an AI-powered tutoring assistant into a single, cohesive system. The platform enables students and faculty to manage academic materials and announcements, participate in structured discussion threads, communicate through real-time chat, and receive AI-generated assistance that is grounded in course-specific knowledge.'),
  blankLine(),
  body('The technical architecture of jAIcianVerse is built on a React and TypeScript frontend for an interactive and type-safe user interface, a Node.js and Express.js backend that exposes RESTful APIs for data management, and a MongoDB database for flexible document storage. Real-time communication is handled through Socket.io, supporting features such as instant messaging, typing indicators, and read receipts. Token-based authentication using JSON Web Tokens (JWT) ensures that all sensitive operations are protected and properly attributed to verified users.'),
  blankLine(),
  body('The AI assistant module is the most distinctive component of the platform. Rather than relying on a generic large language model that answers freely from its training data, jAIcianVerse uses Retrieval-Augmented Generation (RAG) to first search a curated university knowledge base for relevant content, and then uses that context to generate answers that are aligned with what the course actually covers. This reduces the risk of hallucinated or off-topic responses that are common in unconstrained AI assistants.'),
  blankLine(),
  body('In addition to RAG-based grounding, the project includes a complete LoRA-based fine-tuning pipeline. Using the Unsloth and HuggingFace Transformers ecosystem, the pipeline converts college notes into instruction-style question-answer datasets, trains lightweight LoRA adapters on a base language model, and exports the resulting fine-tuned model to a format deployable with the Ollama local inference runtime. This fine-tuning step helps align the model\'s tone, phrasing, and familiarity with academic subject matter.'),
  blankLine(),
  body('The overall outcome is a modular, demonstrable platform that supports structured learning, collaborative discussions, and syllabus-grounded AI assistance — all accessible through a single web-based interface. The project also establishes a foundation for future enhancements such as role-based access control, PDF/DOCX ingestion into the RAG pipeline, evaluation metrics for AI response quality, and production-level deployment practices.'),
  blankLine(),
  bodyPara([runBold('Keywords: '), run('Academic Platform, Retrieval-Augmented Generation, LoRA Fine-Tuning, Real-time Collaboration, Full-Stack Web Development, AI Tutoring, Socket.io, React, Node.js, MongoDB.')]),
];

// ── LIST OF TABLES ────────────────────────────────────────────────────────────
const listOfTablesPage = [
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'LIST OF TABLES', font: TNR, size: 28, bold: true, underline: { type: UnderlineType.SINGLE } })] }),
  blankLine(),
  makeTable([
    tableRow([hdrCell('Table No.', 1500), hdrCell('Title', 5666), hdrCell('Page No.', 1500)]),
    tableRow([cell('Table I', 1500, true), cell('Literature Review Summary (Table 2.1)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table II', 1500, true), cell('Software Requirements (Table 3.1)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table III', 1500, true), cell('Hardware Requirements (Table 3.2)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table IV', 1500, true), cell('Module-wise Technology Summary (Table 4.1)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table V', 1500, true), cell('Key REST API Route Groups (Table 5.1)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table VI', 1500, true), cell('Socket Events Used for Collaboration (Table 5.2)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table VII', 1500, true), cell('Feature Validation Summary (Table 6.1)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table VIII', 1500, true), cell('Representative AI Usage Scenarios (Table 6.2)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table IX', 1500, true), cell('Project Team Details (Appendix A)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Table X', 1500, true), cell('CO, PO and PSO Mapping (Appendix B)', 5666), cell('xx', 1500, true)]),
  ], [1500, 5666, 1500]),
];

// ── LIST OF FIGURES ───────────────────────────────────────────────────────────
const listOfFigsPage = [
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'LIST OF FIGURES', font: TNR, size: 28, bold: true, underline: { type: UnderlineType.SINGLE } })] }),
  blankLine(),
  makeTable([
    tableRow([hdrCell('Figure No.', 1500), hdrCell('Title', 5666), hdrCell('Page No.', 1500)]),
    tableRow([cell('Fig. 1', 1500, true), cell('Overall System Architecture (High Level)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 2', 1500, true), cell('RAG Generation Flow', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 3', 1500, true), cell('JWT Authentication Flow (Simplified)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 4', 1500, true), cell('Real-Time Message Delivery Flow', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 5', 1500, true), cell('Fine-Tuning and Export Pipeline', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 6', 1500, true), cell('Database Entity Relationship (Conceptual)', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 7', 1500, true), cell('Login Page Screenshot', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 8', 1500, true), cell('Signup Page Screenshot', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 9', 1500, true), cell('Home / Dashboard Screenshot', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 10', 1500, true), cell('Materials / Notes Module Screenshot', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 11', 1500, true), cell('Discussions / Q&A Module Screenshot', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 12', 1500, true), cell('Chat Module Screenshot', 5666), cell('xx', 1500, true)]),
    tableRow([cell('Fig. 13', 1500, true), cell('AI Assistant Response (RAG Example) Screenshot', 5666), cell('xx', 1500, true)]),
  ], [1500, 5666, 1500]),
];

// ── CHAPTER 1: INTRODUCTION ───────────────────────────────────────────────────
const ch1 = [
  ch('Chapter 1\nIntroduction'),

  body('Higher education today stands at an interesting crossroads — the amount of digital content available to students has never been greater, yet the tools used to access, discuss, and understand that content remain surprisingly scattered. Lecture slides live in one folder, doubt-solving happens over informal messaging groups, and AI assistants (where used) are completely disconnected from the course syllabus. The result is a fragmented learning experience that places an unnecessary cognitive burden on students who simply want to study effectively.'),
  blankLine(),
  body('This project, jAIcianVerse, is designed with a straightforward motivation: to bring structured academic content, collaborative communication, and AI-powered assistance together into a single platform that actually understands the course context. The name itself reflects this vision — a platform where AI (the "AI" prefix) meets academic collaboration (the "Verse," as in universe of learning).'),
  blankLine(),
  body('This introductory chapter outlines the specific problem this project solves, the aim and objectives it pursues, the boundaries of the work undertaken, and how the rest of the report is organized.'),

  sec('1.1 Problem Statement'),
  body('In everyday college life, students routinely encounter small learning roadblocks that interrupt their study flow. A concept may feel incomplete after class, a formula may need re-examination during revision, or a question may surface while reading notes late at night. Under these circumstances, students typically have three options: search the internet (where answers may not align with the specific syllabus), reach out to peers (who may not always be available or accurate), or simply wait for the next class. All three options carry delays and uncertainties.'),
  blankLine(),
  body('The situation is further complicated by fragmentation. Most academic workflows are spread across multiple disconnected tools — one application handles learning materials, a separate one handles messaging, another handles announcements, and AI assistants (where used at all) exist as entirely separate services with no awareness of what the course is actually teaching. This constant context-switching reduces learning continuity and makes collaborative study harder than it needs to be.'),
  blankLine(),
  body('General-purpose AI assistants present a specific risk in academic contexts. These tools can produce confident-sounding answers that are factually incorrect, out-of-date, or simply irrelevant to the course syllabus — a phenomenon commonly referred to as "hallucination." This is particularly problematic in technical subjects where a subtly wrong answer can misdirect a student\'s understanding. The need for a system that produces trustworthy, syllabus-aligned answers is clear.'),
  blankLine(),
  body('Therefore, the core problem this project addresses is: how to build a unified academic platform that integrates content management, real-time collaboration, and an AI assistant whose responses are grounded in actual course materials, all within a single cohesive application that students and faculty can use without switching contexts.'),

  sec('1.2 Aim'),
  body('The aim of this project is to design and develop jAIcianVerse — a full-stack academic platform that combines content management and collaborative features with an AI assistant that is grounded in course materials through Retrieval-Augmented Generation (RAG) and domain-aligned through LoRA-based fine-tuning.'),
  blankLine(),
  body('The platform is intended to demonstrate that AI assistance in education does not have to be generic. With the right combination of retrieval-based grounding and parameter-efficient fine-tuning, it is possible to build an academic AI assistant that behaves in a trustworthy and course-relevant manner — and to deliver this capability as part of a complete, working web application rather than an isolated prototype.'),

  sec('1.3 Objectives'),

  subsec('1.3.1 Build a Unified Academic Platform'),
  body('The first objective is to implement the core academic modules — units, learning materials, announcements, and discussion threads — within a single integrated application. Students and faculty should be able to navigate across these modules without leaving the platform or switching applications.'),
  blankLine(),
  body('This objective addresses the fragmentation problem directly. When content, communication, and AI assistance all live in the same system, the learner can follow a natural flow: study a unit, ask a question in the discussion, collaborate in chat, and use AI for deeper clarification — without interrupting the learning journey.'),

  subsec('1.3.2 Implement Secure Authentication and User Management'),
  body('The second objective is to establish a proper user identity system with secure registration, login, and role-based access control. All sensitive operations must require valid authentication, and the system must prevent unauthorized access to private data.'),
  blankLine(),
  body('Token-based authentication using JSON Web Tokens (JWT) is used for this purpose. The same token is also reused in socket-based communication to ensure that real-time interactions are equally secured and correctly attributed to their originating users.'),

  subsec('1.3.3 Enable Real-Time Collaboration'),
  body('The third objective is to implement live communication features that allow students and faculty to coordinate instantly. This includes one-to-one chat, group conversations, typing indicators, and read receipts — all functioning in real time.'),
  blankLine(),
  body('Socket.io is used to implement a bidirectional event-driven communication layer. REST APIs handle chat history and metadata, while socket events handle the low-latency, live interactions. This hybrid approach keeps the system responsive and reliable simultaneously.'),

  subsec('1.3.4 Implement Retrieval-Augmented Generation (RAG)'),
  body('The fourth objective is to implement a RAG-based retrieval workflow that improves the quality and relevance of AI-generated answers. Before answering a question, the system retrieves semantically relevant chunks from a curated knowledge base (college notes and course materials), and those chunks are provided as context to the language model.'),
  blankLine(),
  body('This approach reflects a well-established technique in natural language processing where retrieval from a knowledge store is used to ground generation and reduce hallucination. For an academic setting, this means answers are influenced by the actual notes provided by the institution — not by whatever the model internalized during general pretraining.'),
  blankLine(),
  body('Semantic retrieval is performed using embedding-based similarity search, which allows students to ask questions in natural language even when the stored notes use more formal terminology. The system bridges this vocabulary gap through vector-space similarity rather than keyword matching.'),

  subsec('1.3.5 Fine-Tune the LLM Using LoRA and Integrate Inference'),
  body('The fifth objective is to carry out parameter-efficient fine-tuning of a base language model using LoRA (Low-Rank Adaptation), and to integrate the resulting fine-tuned model into the application\'s inference pipeline.'),
  blankLine(),
  body('Fine-tuning is used to align the model\'s response style, tone, and domain familiarity with academic expectations. LoRA makes this feasible in an academic project context by learning only a small set of adapter parameters rather than updating the full model — significantly reducing compute cost without sacrificing meaningful domain adaptation.'),
  blankLine(),
  body('The fine-tuning pipeline is end-to-end: it converts course notes into instruction-style datasets, trains LoRA adapters, exports the resulting model to a deployable format (GGUF), and integrates it into the Ollama-based local inference runtime used by the application.'),

  subsec('1.3.6 Deliver a Demonstrable, Modular System'),
  body('The sixth objective is to deliver a system where each module — frontend, backend, real-time layer, AI server, retrieval service, and fine-tuning pipeline — has clear boundaries and can be demonstrated independently or as a whole. This ensures that the project is evaluable at each layer, not only as a black box.'),

  sec('1.4 Scope of the Project'),
  body('The scope of jAIcianVerse covers the complete development cycle of an AI-augmented academic platform, from initial design through implementation and functional validation. The following areas are within scope:'),
  blankLine(),
  bullet('Frontend: A web-based UI built using React and TypeScript, accessible through modern browsers.'),
  bullet('Backend: RESTful API services built with Node.js and Express.js, connected to a MongoDB database.'),
  bullet('Real-time communication: A Socket.io-based event layer for chat, typing indicators, and read receipts.'),
  bullet('AI subsystem: A dedicated AI-Server that orchestrates retrieval (via RAG-BOT) and generation (via Ollama) to produce grounded, domain-aligned responses.'),
  bullet('Fine-tuning pipeline: An offline LoRA-based training and export workflow that produces a deployable model artifact from course-specific instruction data.'),
  bullet('Functional validation: Feature-level testing and scenario-based qualitative evaluation of each module.'),
  blankLine(),
  body('The following areas are explicitly out of scope for this academic version:'),
  blankLine(),
  bullet('Enterprise-scale deployment, high-availability infrastructure, or containerized production orchestration (e.g., Kubernetes).'),
  bullet('Formal user studies or large-scale quantitative evaluation with real student cohorts.'),
  bullet('Institutional data governance, compliance with educational data privacy regulations (e.g., FERPA), or integration with existing university ERP systems.'),
  bullet('Mobile native application development (iOS/Android).'),
  blankLine(),
  body('This is a standalone academic project and does not involve an external industry organization; hence, a company profile chapter is not applicable.'),

  sec('1.5 Organization of the Report'),
  body('The remainder of this report is organized as follows:'),
  blankLine(),
  bullet('Chapter 2 presents a review of related work in areas such as academic platforms, AI tutoring, retrieval-augmented generation, semantic search, LoRA fine-tuning, and real-time collaboration. A gap analysis concludes the chapter by identifying the specific limitations that this project addresses.'),
  bullet('Chapter 3 documents the system requirements — inputs, outputs, software stack, hardware considerations, functional requirements, and non-functional quality attributes.'),
  bullet('Chapter 4 describes the tools and technologies selected for the project, explaining the rationale for each choice.'),
  bullet('Chapter 5 presents the complete system design and implementation, covering architecture, backend API design, database schema, real-time messaging, AI subsystem design, fine-tuning pipeline, and frontend implementation.'),
  bullet('Chapter 6 presents results and discussion, including module-wise functional outcomes, feature validation, AI-specific observations, and acknowledged limitations.'),
  bullet('Chapter 7 concludes the report with a summary of contributions and a detailed discussion of future enhancements.'),
  bullet('References and Appendices follow, including the project team details, CO/PO/PSO mapping, and screenshot evidence.'),
];

// ── CHAPTER 2: LITERATURE REVIEW ─────────────────────────────────────────────
const ch2 = [
  ch('Chapter 2\nLiterature Review'),

  body('This chapter surveys the relevant background literature and prior work in the domains that directly inform the design of jAIcianVerse. The coverage includes academic platforms and learning workflows, AI-based tutoring, retrieval-augmented generation, semantic search using embeddings, parameter-efficient fine-tuning (LoRA), real-time collaboration, and multimedia learning principles. The chapter concludes with a structured gap analysis that articulates precisely what this project contributes beyond the surveyed work.'),

  sec('2.1 Related Works'),

  subsec('2.1.1 Academic Platforms and Learning Management Systems'),
  body('Learning Management Systems (LMS) have been a staple of institutional education for over two decades. Platforms such as Moodle, Blackboard, and Canvas provide structured environments for distributing syllabi, uploading lecture materials, managing assignments, and communicating course announcements. Research on LMS adoption has generally confirmed that organized digital content delivery improves student access to course materials, particularly for students who may have missed classes or need to review content at their own pace [1].'),
  blankLine(),
  body('However, a persistent criticism of traditional LMS design is that it is fundamentally one-directional: content flows from instructors to students, with limited built-in support for interactive doubt-solving or AI-assisted learning. Students using LMS platforms still rely on external applications for real-time queries, peer collaboration, and quick explanations. This friction between content access and active learning represents a structural weakness that more recent systems attempt to address.'),
  blankLine(),
  body('Several studies on adaptive learning in digital environments have noted that students benefit most when learning tools respond to their individual needs and queries dynamically, rather than presenting static content alone [1]. This observation motivates the integration of collaborative and AI features directly into the academic content environment, which is the core premise of jAIcianVerse.'),

  subsec('2.1.2 Discussion Forums and Peer-Assisted Learning'),
  body('Course-based discussion boards are among the more widely accepted additions to digital learning environments. Systems such as Piazza, Ed Discussion, and built-in LMS forums allow students to post questions, receive answers from peers or instructors, and access a growing archive of resolved doubts. Research suggests that these forums improve learning outcomes when students actively engage rather than passively read — particularly in technical courses where multiple explanations of the same concept can be valuable.'),
  blankLine(),
  body('The strength of forum-based Q&A lies in its reviewability and persistence: a well-answered question remains accessible to future students. The limitation is latency — responses depend on the availability of knowledgeable peers or instructors. In a busy semester, response times can be slow, and students facing a blocking doubt late at night may find the forum unhelpful until the next morning.'),
  blankLine(),
  body('This motivates the combination of discussion threads with an AI assistant in jAIcianVerse. The forum provides the structured, reviewed, reviewable record of doubts and answers, while the AI assistant provides an immediate first response that can reduce the urgency of waiting for a human answer. Together, they serve complementary needs without either replacing the other.'),

  subsec('2.1.3 AI Tutoring Systems and Educational Chatbots'),
  body('The development of AI tutoring systems has a long history, stretching from rule-based intelligent tutoring systems in the 1980s to modern large language model (LLM)-based assistants. Early intelligent tutoring systems were highly domain-specific, requiring manual knowledge engineering to represent course content and student state. They could be effective but were expensive to develop and maintain.'),
  blankLine(),
  body('Modern LLM-based approaches have dramatically lowered the cost of building educational chatbots, since the model already has broad general knowledge and can discuss a wide range of topics. However, this generality introduces a new problem: the model has no particular commitment to the specific syllabus, terminology, or examples used in a given course. Students asking about specific topics may receive technically correct but contextually misaligned answers.'),
  blankLine(),
  body('Research on adaptive learning in e-learning consistently emphasizes that personalization can improve engagement and outcomes, but only when the system has access to relevant learner and content context [1]. When AI assistants lack this grounding, their benefits are partially offset by the time students spend verifying whether the advice aligns with what their course actually expects. This directly motivates the RAG-based grounding approach used in jAIcianVerse.'),

  subsec('2.1.4 Retrieval-Augmented Generation (RAG)'),
  body('Retrieval-Augmented Generation (RAG) was introduced as a general framework for knowledge-intensive natural language processing tasks. In its standard formulation, a dense retriever encodes both the query and a corpus of documents into a shared vector space, retrieves the most relevant passages using maximum inner product search, and then uses a sequence-to-sequence model to generate the final answer conditioned on both the query and retrieved passages. This architecture has since become a standard recipe for building grounded AI systems.'),
  blankLine(),
  body('In educational applications, RAG is particularly well-suited because the desired grounding material (course notes, textbook excerpts, past solutions) can be pre-indexed into the retrieval store. When a student asks a question, the system retrieves the most relevant instructional content and uses it to condition the generation step. This results in answers that are more likely to reflect what the institution actually teaches, rather than generic internet knowledge [2].'),
  blankLine(),
  body('More advanced educational RAG systems have explored integrating knowledge graphs as a structural overlay on the retrieval corpus, allowing the system to represent concept relationships and not just document similarity [2]. While jAIcianVerse does not currently implement a knowledge graph layer, this direction represents a clear future extension, as discussed in Chapter 7.'),
  blankLine(),
  body('A practical consideration in RAG implementations is the quality of chunking and indexing. If course notes are split into poorly-sized chunks — too large to be specific, too small to provide context — retrieval quality degrades. The project implements a chunking strategy designed to balance context richness and specificity, acknowledging that this is an area where further optimization can improve answer quality.'),

  subsec('2.1.5 Semantic Search Using Embeddings'),
  body('Vector-based semantic search is the retrieval backbone of modern RAG systems. Text embeddings map sequences of words into high-dimensional vectors such that semantically similar sequences end up close to each other in the embedding space — regardless of whether they share the same surface words. This property is critical for educational applications where student queries are informal ("just explain this thing quickly") while stored notes are formal ("the following theorem states...").'),
  blankLine(),
  body('Commonly used embedding models for semantic retrieval include those from the Sentence-Transformers family, OpenAI\'s embedding API, and other encoder-based models. The cosine similarity between a query embedding and document embeddings is the standard distance metric for retrieving top-k relevant chunks.'),
  blankLine(),
  body('In jAIcianVerse, semantic retrieval is implemented in the RAG-BOT component, which accepts a query, encodes it, searches the indexed knowledge base, and returns the top-k most relevant chunks to the AI-Server for prompt augmentation. The use of semantic search over keyword search means that students can ask questions in their natural language without needing to match the exact phrasing used in the notes.'),

  subsec('2.1.6 Parameter-Efficient Fine-Tuning (LoRA)'),
  body('Fine-tuning large language models for domain adaptation has traditionally required updating all model parameters, which demands substantial compute resources and storage. This made full fine-tuning impractical for academic or low-resource settings. Parameter-efficient fine-tuning (PEFT) methods address this by learning a small set of additional parameters while keeping the base model weights frozen.'),
  blankLine(),
  body('Low-Rank Adaptation (LoRA) is currently one of the most widely used PEFT methods. The key idea is that the weight update during fine-tuning can be approximated by a low-rank matrix decomposition. For a weight matrix W in the base model, LoRA represents the update as the product of two smaller matrices: ΔW = B × A, where A and B have significantly fewer parameters than the original weight matrix. This reduces the number of trainable parameters by orders of magnitude, making fine-tuning feasible even on consumer hardware [15].'),
  blankLine(),
  body('Empirically, LoRA has been shown to match or closely approximate full fine-tuning on a variety of downstream tasks, while using a fraction of the training compute and storage. For the purposes of this project, LoRA fine-tuning is used to align the base model\'s response style with academic domain expectations — specifically, the kind of structured, explanation-focused responses appropriate for a college tutoring context.'),
  blankLine(),
  body('It is important to note that fine-tuning improves behavior (how the model responds) but does not add new factual knowledge from the course. Factual grounding is the role of RAG. The combination of both approaches — fine-tuning for style and RAG for content — provides a more complete solution than either approach alone.'),

  subsec('2.1.7 Real-Time Communication in Collaborative Learning'),
  body('Real-time messaging systems in collaborative environments are typically implemented using WebSocket-based protocols or higher-level abstractions such as Socket.io. The design of such systems involves choosing between full-duplex persistent connections (appropriate for low-latency messaging) and polling-based approaches (simpler but higher latency).'),
  blankLine(),
  body('In educational settings, real-time collaboration has been shown to improve student engagement when it enables productive social learning behaviors such as asking and answering questions, sharing resources, and coordinating group work. Research also suggests, however, that AI tools within collaborative platforms can reshape interaction dynamics — for example, when students begin directing questions to the AI rather than to peers or instructors, the nature of learner-instructor interaction can shift in ways that need to be managed thoughtfully [4].'),
  blankLine(),
  body('This observation shaped a key design principle in jAIcianVerse: the AI assistant is positioned as a complement to the discussion and chat modules, not as a replacement. Students are encouraged to use the AI for initial clarifications and then bring confirmed understanding into forum discussions with peers.'),

  subsec('2.1.8 Multimedia Learning Principles and Interface Design'),
  body('Educational interface design is informed by multimedia learning theory, which argues that learners process verbal and visual information through separate cognitive channels, and that effective learning happens when both channels are used appropriately without overloading either. Well-designed digital learning environments should present information in organized, retrievable formats rather than as unstructured streams of text or unsorted content [3].'),
  blankLine(),
  body('In practice, this means that the UI design of jAIcianVerse should make it easy to navigate between units and materials, clearly separate different types of content (announcements versus study materials versus discussions), and present AI responses in a readable format that students can review incrementally rather than all at once. These principles informed the decision to use a component-based frontend with TypeScript for type safety and a consistent layout system using Tailwind CSS.'),

  tableCaption('Table 2.1: Literature Review Summary'),
  makeTable([
    tableRow([hdrCell('Sl. No.', 500), hdrCell('Author(s)', 1600), hdrCell('Year', 500), hdrCell('Key Contribution / Finding', 3666), hdrCell('Relevance to Project', 2400)]),
    tableRow([cell('[1]', 500, true), cellRuns([run('Gligorea, I. et al.')], 1600), cell('2024', 500, true), cellRuns([run('Reviewed evidence that AI-driven personalization improves learner engagement; highlighted implementation and data-privacy challenges in e-learning.')], 3666), cellRuns([run('Motivates the design of a grounded, privacy-aware AI assistant over generic chatbots.')], 2400)]),
    tableRow([cell('[2]', 500, true), cellRuns([run('Dong, C. et al.')], 1600), cell('2023', 500, true), cellRuns([run('Proposed knowledge graph-enhanced RAG for academic tutoring; demonstrated improvement over baseline in controlled evaluation.')], 3666), cellRuns([run('Directly informs the RAG pipeline design; KG extension is identified as future work.')], 2400)]),
    tableRow([cell('[3]', 500, true), cellRuns([run('Mayer, R. E.')], 1600), cell('2009', 500, true), cellRuns([run('Argued that well-structured visual-verbal presentation improves understanding; supports learner-controlled pacing.')], 3666), cellRuns([run('Informs frontend design decisions: structured layout, organized modules, readable AI responses.')], 2400)]),
    tableRow([cell('[4]', 500, true), cellRuns([run('Seo, K. et al.')], 1600), cell('2021', 500, true), cellRuns([run('Showed that AI tools can shift learner-instructor interaction; automation helps but may reduce perceived instructor presence.')], 3666), cellRuns([run('Supports keeping AI as a supplement to human-driven discussions, not a replacement.')], 2400)]),
    tableRow([cell('[15]', 500, true), cellRuns([run('Hu, E. J. et al.')], 1600), cell('2021', 500, true), cellRuns([run('Introduced LoRA, showing low-rank adaptation can match full fine-tuning quality while training far fewer parameters.')], 3666), cellRuns([run('Directly used in the Fine-Tune module to enable feasible domain adaptation on limited hardware.')], 2400)]),
  ], [500, 1600, 500, 3666, 2400]),

  sec('2.2 Gap Analysis'),
  body('The literature review above identifies several strengths and limitations of existing approaches. The following gaps directly motivate the design decisions made in jAIcianVerse:'),
  blankLine(),

  subsec('2.2.1 Absence of Syllabus-Grounded AI in Integrated Academic Tools'),
  body('Most academic platforms either provide no AI assistance at all, or rely on general-purpose chatbot integrations that have no awareness of course-specific materials. Students using these tools may receive confident but contextually misaligned answers, particularly in technical subjects. The integration of RAG with a university-specific knowledge base directly addresses this gap, ensuring that answers reflect what the course actually teaches.'),

  subsec('2.2.2 Fragmentation of Academic Workflow and AI Features'),
  body('No widely deployed academic tool currently offers a truly integrated combination of structured content management, real-time collaboration, and grounded AI assistance within a single platform. Most solutions either cover content and communication (LMS-type systems) or AI assistance (chatbot tools) — but not both, and certainly not with grounding and style alignment. jAIcianVerse fills this gap by making all three capabilities available in one workflow.'),

  subsec('2.2.3 Single-Technique AI Approaches Lack Balance'),
  body('Several research implementations use RAG alone for knowledge grounding, or fine-tuning alone for domain behavior — but not both together. RAG without fine-tuning can produce factually grounded but stylistically inconsistent responses. Fine-tuning without RAG improves style but does not add course-specific factual knowledge. Combining both, as done in this project, provides a more balanced solution where behavior and content quality are both addressed.'),

  subsec('2.2.4 Real-Time Collaboration Treated as External to Learning'),
  body('In existing systems, messaging and chat are typically handled by external tools (WhatsApp, Telegram, Slack) that are entirely separate from the academic content environment. This separation means that discussions happening around a specific unit or material are disconnected from that content. Embedding real-time collaboration directly inside the academic platform, as jAIcianVerse does, improves continuity and allows collaborative conversations to reference the same material context.'),

  subsec('2.2.5 Limited Accessibility of Fine-Tuned Models for Academic Projects'),
  body('Existing literature on fine-tuning often assumes enterprise-level compute resources. For an academic project, the challenge is to make fine-tuning both feasible and demonstrable. The use of LoRA with the Unsloth acceleration library and the Ollama local inference runtime addresses this gap by providing an end-to-end pipeline that is practical on hardware commonly available to students and academic labs.'),
];

// ── CHAPTER 3: SYSTEM REQUIREMENTS ───────────────────────────────────────────
const ch3 = [
  ch('Chapter 3\nSystem Requirements and Analysis'),

  body('This chapter documents the requirements that guided the development of jAIcianVerse. Requirements analysis is the process of identifying, documenting, and validating the conditions that a system must satisfy to be useful and correct. For this project, requirements are organized into input/output expectations, software and hardware needs, functional specifications, and non-functional quality attributes.'),

  sec('3.1 Input Requirements'),
  body('The system accepts a range of inputs depending on the module being used. These can be broadly classified into three categories: user interaction inputs, academic content inputs, and AI knowledge inputs.'),
  blankLine(),
  subsubsec('User Interaction Inputs'),
  bullet('Registration details: Username, email address, password, and basic profile information.'),
  bullet('Authentication credentials: Email and password for login; JWT token for subsequent session maintenance.'),
  bullet('Chat messages: Text content submitted by users in one-to-one or group conversations.'),
  bullet('Discussion threads and answers: Topic title, detailed question body, and answer text for Q&A modules.'),
  bullet('AI queries: Natural language questions or prompts submitted to the AI assistant module.'),
  blankLine(),
  subsubsec('Academic Content Inputs'),
  bullet('Unit and material metadata: Title, description, type, and any associated file references.'),
  bullet('Notes and documents: Text-based or file-based learning content uploaded by authorized users.'),
  bullet('Announcements: Short broadcast messages posted by faculty or administrators.'),
  blankLine(),
  subsubsec('AI Knowledge Inputs'),
  bullet('Knowledge base files: Plain text files containing course notes, lecture summaries, and reference material used to build the RAG retrieval index.'),
  bullet('Fine-tuning dataset: Instruction-output pairs in JSONL format, generated from course content and used for LoRA adapter training.'),

  sec('3.2 Output Requirements'),
  body('The outputs of jAIcianVerse can be divided into user-facing outputs that directly serve learners and faculty, and system-level outputs that support operation, debugging, and model deployment.'),
  blankLine(),
  subsubsec('User-Facing Outputs'),
  bullet('Discussion and chat responses: Rendered messages with sender identity, timestamps, read/delivery status, and the ability to edit or delete.'),
  bullet('Organized academic content: Units and materials presented with proper structure, metadata, and interactive features such as upvoting.'),
  bullet('AI assistant responses: Generated text answers that incorporate retrieved context from the knowledge base, displayed in a readable, structured format within the chat/AI interface.'),
  bullet('Announcements: Visible broadcast notifications for course-level updates.'),
  blankLine(),
  subsubsec('System-Level Outputs'),
  bullet('REST API responses: JSON-formatted responses for all client requests, including success payloads and standardized error messages.'),
  bullet('Real-time socket events: JSON event payloads delivered to subscribed clients for chat operations (message delivery, typing, read receipts, etc.).'),
  bullet('Fine-tuning artifacts: Saved LoRA adapter weights, merged model files, GGUF export, and Ollama model files ready for local inference.'),
  bullet('Logs and error traces: Runtime logs for debugging and performance monitoring during development and demonstration.'),

  sec('3.3 Software Requirements'),
  body('The following software environment was used to develop, run, and demonstrate jAIcianVerse. The system is designed to run on standard development machines with no proprietary software dependencies.'),
  blankLine(),
  tableCaption('Table 3.1: Software Requirements'),
  makeTable([
    tableRow([hdrCell('Component', 1800), hdrCell('Requirement / Version', 2200), hdrCell('Purpose', 4666)]),
    tableRow([cell('Operating System', 1800), cell('Windows 10/11 or Ubuntu 20.04+', 2200), cell('Development and demonstration environment', 4666)]),
    tableRow([cell('Node.js Runtime', 1800), cell('v18.x LTS or above', 2200), cell('Runs the Server and AI-Server modules', 4666)]),
    tableRow([cell('Package Manager', 1800), cell('npm (bundled with Node.js)', 2200), cell('Manages JavaScript/TypeScript dependencies', 4666)]),
    tableRow([cell('Database', 1800), cell('MongoDB 6.x (local or Atlas cloud)', 2200), cell('Stores users, chats, messages, materials, discussions', 4666)]),
    tableRow([cell('Python', 1800), cell('Python 3.10 or above', 2200), cell('Runs RAG-BOT semantic retrieval and fine-tuning scripts', 4666)]),
    tableRow([cell('Python Packages', 1800), cell('As per requirements.txt', 2200), cell('Embeddings, vector search, transformer training, evaluation', 4666)]),
    tableRow([cell('LLM Runtime', 1800), cell('Ollama (latest stable)', 2200), cell('Serves the base or fine-tuned LLM for generation', 4666)]),
    tableRow([cell('Browser', 1800), cell('Chrome / Edge / Firefox (latest)', 2200), cell('Runs the React TypeScript client application', 4666)]),
    tableRow([cell('Code Editor', 1800), cell('VS Code (recommended)', 2200), cell('Development environment for all modules', 4666)]),
    tableRow([cell('Version Control', 1800), cell('Git', 2200), cell('Source control and collaboration across modules', 4666)]),
  ], [1800, 2200, 4666]),

  sec('3.4 Hardware Requirements'),
  body('Hardware requirements vary depending on the task. Running the web application requires modest resources, while fine-tuning a language model locally demands more. The following table outlines recommended specifications for three distinct use cases.'),
  blankLine(),
  tableCaption('Table 3.2: Hardware Requirements'),
  makeTable([
    tableRow([hdrCell('Use Case', 2200), hdrCell('CPU', 1600), hdrCell('RAM', 1066), hdrCell('Storage', 1200), hdrCell('GPU', 2600)]),
    tableRow([cell('Client + Server + Database only', 2200), cell('4 cores / 2.0 GHz+', 1600), cell('8 GB', 1066), cell('10 GB free', 1200), cell('Not required', 2600)]),
    tableRow([cell('AI inference locally (Ollama)', 2200), cell('6+ cores / 2.5 GHz+', 1600), cell('16 GB', 1066), cell('20 GB free', 1200), cell('Helpful; 4 GB VRAM min for GPU inference', 2600)]),
    tableRow([cell('LoRA fine-tuning locally', 2200), cell('8+ cores / 3.0 GHz+', 1600), cell('16–32 GB', 1066), cell('30 GB free', 1200), cell('Recommended; 8+ GB VRAM for efficient training', 2600)]),
  ], [2200, 1600, 1066, 1200, 2600]),
  blankLine(),
  body('Note: Fine-tuning was performed on a workstation with sufficient GPU resources. The trained and exported model artifact (GGUF) can then be used on the inference machine independently of the training environment.'),

  sec('3.5 Functional Requirements'),
  body('Functional requirements describe what the system must do — the specific behaviors and capabilities that constitute its core value. For jAIcianVerse, these are organized by module.'),
  blankLine(),
  subsubsec('User Authentication and Profile Management'),
  bullet('The system shall allow new users to register with a username, email, and password.'),
  bullet('The system shall authenticate registered users and issue a time-limited JWT upon successful login.'),
  bullet('The system shall protect all sensitive endpoints using token-based authentication middleware.'),
  bullet('The system shall allow authenticated users to view and update their profile information.'),
  blankLine(),
  subsubsec('Academic Content Management'),
  bullet('The system shall allow authorized users to create and manage academic units or modules.'),
  bullet('The system shall allow uploading and associating learning materials (notes, references) with specific units.'),
  bullet('The system shall allow publishing announcements that are visible to all platform users.'),
  bullet('The system shall allow users to upvote materials to signal quality content.'),
  blankLine(),
  subsubsec('Discussions and Q&A'),
  bullet('The system shall allow any authenticated user to create a new discussion thread with a title and descriptive body.'),
  bullet('The system shall allow users to post answers to existing discussion threads.'),
  bullet('The system shall display discussion threads and associated answers in a structured and retrievable format.'),
  blankLine(),
  subsubsec('Real-Time Messaging'),
  bullet('The system shall allow users to initiate one-to-one and group chat conversations.'),
  bullet('The system shall deliver messages in real time to all participants in a conversation using socket events.'),
  bullet('The system shall persist all messages in the database so chat history is available upon reconnection.'),
  bullet('The system shall support typing indicators and read receipts for active conversations.'),
  bullet('The system shall allow users to edit or soft-delete sent messages.'),
  blankLine(),
  subsubsec('AI Assistant'),
  bullet('The system shall accept natural language queries from authenticated users.'),
  bullet('The system shall retrieve semantically relevant context from the knowledge base using embedding-based similarity search.'),
  bullet('The system shall generate a contextually grounded response by augmenting the LLM prompt with retrieved context.'),
  bullet('The system shall fall back to generating without retrieval context if the retrieval service is temporarily unavailable.'),

  sec('3.6 Non-Functional Requirements'),
  body('Non-functional requirements describe the quality characteristics that govern how well the system performs its functions. These are often as important as the functional requirements in determining user experience and long-term maintainability.'),
  blankLine(),
  subsubsec('Usability'),
  body('The platform interface should be navigable by users with basic computer literacy. Features such as materials, discussions, chat, and AI assistant should be accessible from a consistent layout without requiring extensive orientation. The AI response format should be readable and structured, avoiding walls of unformatted text.'),
  blankLine(),
  subsubsec('Performance'),
  body('Common UI interactions such as loading chat history, navigating to discussion threads, and fetching materials should complete within acceptable response times in a local demonstration setup. AI responses may take longer depending on the model size and hardware, but the system should indicate loading state clearly to avoid user confusion.'),
  blankLine(),
  subsubsec('Reliability'),
  body('The system should handle individual service failures gracefully. If the RAG-BOT retrieval service is temporarily unavailable, the AI-Server should fall back to direct generation rather than returning an error. Database connection errors should produce informative messages rather than silent failures.'),
  blankLine(),
  subsubsec('Security'),
  body('All API endpoints that handle user-specific or sensitive data must require a valid JWT. Password fields must not be returned in any API response. Socket connections must authenticate using the same token mechanism as REST requests, ensuring that real-time events are not anonymous.'),
  blankLine(),
  subsubsec('Maintainability'),
  body('Module boundaries between Client, Server, AI-Server, RAG-BOT, and Fine-Tune must be clearly defined. Each module should be independently runnable and testable. Shared data contracts should use well-defined schemas, and error handling should be consistent across modules.'),
  blankLine(),
  subsubsec('Scalability (Design Intent)'),
  body('While the current implementation is optimized for a development and demonstration environment rather than production scale, the architectural choices — stateless REST APIs, socket-based real-time layer, document store, and decoupled AI services — are inherently more scalable than tightly coupled monolithic designs. This means that transitioning to a production deployment would involve operational changes (load balancing, horizontal scaling, monitoring) rather than fundamental architectural changes.'),
];

// ── CHAPTER 4: TOOLS AND TECHNOLOGIES ────────────────────────────────────────
const ch4 = [
  ch('Chapter 4\nTools and Technologies Used'),

  body('This chapter describes the tools, frameworks, libraries, and runtime environments used to build jAIcianVerse. The selection of each technology reflects two overarching priorities: building a working, demonstrable full-stack system with a clean developer experience, and integrating AI capabilities in a way that is practically achievable in an academic project context. Each tool is explained in terms of its purpose, its role in the project, and where relevant, the reasoning for choosing it over alternatives.'),
  blankLine(),
  tableCaption('Table 4.1: Module-wise Technology Summary'),
  makeTable([
    tableRow([hdrCell('Module', 1600), hdrCell('Key Technologies', 2800), hdrCell('Primary Role', 4266)]),
    tableRow([cell('Client', 1600), cell('React, TypeScript, Vite, Tailwind CSS', 2800), cell('Interactive web UI; component-based SPA with type safety', 4266)]),
    tableRow([cell('Server', 1600), cell('Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.io', 2800), cell('REST APIs, database operations, real-time messaging, authentication', 4266)]),
    tableRow([cell('AI-Server', 1600), cell('Node.js, Express.js, Ollama API', 2800), cell('Orchestrates retrieval + LLM generation for AI responses', 4266)]),
    tableRow([cell('RAG-BOT', 1600), cell('Python, Sentence-Transformers, FAISS / ChromaDB', 2800), cell('Semantic search over knowledge base; returns top-k context chunks', 4266)]),
    tableRow([cell('Fine-Tune', 1600), cell('Python, Unsloth, HuggingFace Transformers, LoRA', 2800), cell('Domain adaptation of base LLM; exports deployable GGUF model', 4266)]),
  ], [1600, 2800, 4266]),

  sec('4.1 JavaScript and the Node.js Ecosystem'),
  body('JavaScript serves as the foundational language for the backend services (Server and AI-Server) and as the runtime language for the browser-based client. The Node.js runtime brings JavaScript outside the browser, enabling server-side execution with access to the filesystem, network, and operating system resources. Node.js is particularly well-suited for I/O-intensive applications — such as API servers handling concurrent database queries and socket connections — because of its event-driven, non-blocking architecture.'),
  blankLine(),
  body('In jAIcianVerse, Node.js runs the main backend Express server and the AI-Server module. Both services share the npm ecosystem, making dependency management and tooling consistent across the project. The use of a single language across frontend and backend also reduces the cognitive overhead of switching between different language contexts during development [7].'),

  sec('4.2 TypeScript'),
  body('TypeScript extends JavaScript with a static type system. In a project with multiple complex data models — users, chat rooms, messages, materials, discussions, and AI responses — the ability to define explicit interfaces and catch type errors at compile time rather than at runtime significantly improves code quality and maintainability.'),
  blankLine(),
  body('In jAIcianVerse, TypeScript is most heavily used in the React client. API response shapes are defined as TypeScript interfaces, UI component props are typed, and state management is type-checked. The result is a frontend codebase where refactoring is safer and IDE auto-completion is more reliable. TypeScript also makes it easier for reviewers or collaborators to understand what data each function expects and returns.'),

  sec('4.3 React'),
  body('React is used to build the client application as a component-based single-page application (SPA). React\'s model — building UI from reusable, composable components that re-render reactively when state changes — is well suited to an application with multiple views (chat, materials, discussions, AI assistant) that need to update in response to user interactions and incoming socket events.'),
  blankLine(),
  body('React Hooks (useState, useEffect, useContext, and others) manage local and shared state within the frontend, keeping the application\'s data flow predictable. The component-based architecture also means that UI elements such as the message input bar, the discussion thread display, or the AI response container can be developed and tested in isolation before being assembled into full pages [10].'),

  sec('4.4 Vite'),
  body('Vite is used as the build tool and development server for the frontend. Traditional JavaScript bundlers work by building a full dependency graph before serving the application, which leads to slow start-up times in large projects. Vite uses native ES module support in modern browsers during development, meaning it only processes files that are actually requested — resulting in almost instantaneous server startup and fast hot module replacement (HMR).'),
  blankLine(),
  body('For a project developed under academic time constraints, fast feedback loops during UI development make a meaningful practical difference. Vite also handles production bundling efficiently, producing optimized output for deployment [11].'),

  sec('4.5 Tailwind CSS'),
  body('Tailwind CSS is a utility-first CSS framework that provides low-level design primitives as composable class names. Rather than writing custom CSS for each component, developers apply small, single-purpose utility classes directly in the markup. This approach keeps styling co-located with the component it affects, reduces the risk of style conflicts between components, and produces a consistent visual language across the application.'),
  blankLine(),
  body('In jAIcianVerse, Tailwind CSS ensures that all screens — login, materials, discussions, chat, and AI assistant — share a coherent visual style without the overhead of maintaining a large CSS codebase. For screens with heavy interactivity (the chat interface in particular), the ability to quickly prototype and iterate on layout and spacing using utility classes is especially valuable [12].'),

  sec('4.6 Express.js and REST API Design'),
  body('Express.js is the HTTP framework used to build the backend REST API server. It provides a minimalist, middleware-based request handling model that makes it easy to define routes, apply authentication middleware, validate inputs, and structure responses. Express\'s routing system allows the backend to be organized into clearly separated modules: one for user operations, another for chat and messages, another for discussions, and so on [8].'),
  blankLine(),
  body('All routes that handle user-specific data are protected by a JWT authentication middleware that validates the Authorization header before allowing the request to proceed. This middleware pattern is applied consistently across all protected endpoints without needing to repeat the authentication logic in each handler.'),

  sec('4.7 MongoDB and Mongoose'),
  body('MongoDB is used as the primary database. Its document-oriented model stores data as JSON-like BSON documents, which aligns naturally with the way the application handles data: chat messages are self-contained documents, discussion threads carry their question and metadata in a single record, and user profiles are stored as flexible objects without rigid column constraints [6].'),
  blankLine(),
  body('Mongoose, the ODM (Object Data Modeling) library, is used to define schemas, enforce validation rules, and create model-level methods on top of MongoDB. Mongoose schemas define what fields a document must contain and what types they should be — providing a structure that prevents accidental data inconsistencies. It also enables virtuals, pre/post hooks, and population of referenced documents, which are useful for retrieving related data (such as messages with sender profiles) efficiently.'),

  sec('4.8 Socket.io for Real-Time Communication'),
  body('Socket.io is used to implement the bidirectional, low-latency event channel that powers real-time messaging features. Socket.io abstracts over WebSockets with automatic fallback mechanisms, making the real-time layer more robust across different network environments. The server-side Socket.io instance runs on the same HTTP server as Express, sharing the same port and authentication infrastructure [9].'),
  blankLine(),
  body('A key design choice is to use Socket.io only for real-time events (sending messages, typing indicators, read receipts) while using REST APIs for fetching historical data (loading previous messages, retrieving chat lists). This hybrid approach keeps the socket layer focused on its strength — low-latency updates — while relying on standard REST semantics for data retrieval operations.'),

  sec('4.9 JWT Authentication'),
  body('JSON Web Tokens (JWT) are used for stateless authentication. When a user logs in, the server generates a signed JWT that encodes the user\'s identity and an expiration time. The client stores this token and includes it in the Authorization header of every subsequent request. The server verifies the token\'s signature and reads the user identity without needing to perform a database lookup for each request.'),
  blankLine(),
  body('The same token is also used to authenticate socket connections during the handshake phase, ensuring that all real-time events can be attributed to verified users. This unified authentication model simplifies the security architecture by using a single credential type for both REST and real-time interactions.'),

  sec('4.10 Ollama — Local LLM Inference Runtime'),
  body('Ollama is a local inference runtime for large language models. It provides a simple API for loading models, sending prompts, and streaming generated responses. Ollama supports a variety of open-weight model families and is capable of loading both standard and fine-tuned model formats, including the GGUF format used in this project\'s fine-tuning pipeline [13].'),
  blankLine(),
  body('The choice of Ollama over cloud-based inference APIs (such as OpenAI\'s API) was deliberate. Using a local runtime means the project is fully self-contained and does not require API keys or incur usage costs during development and demonstration. It also allows the project to test and use its own fine-tuned model directly, without needing to deploy the model to an external service.'),

  sec('4.11 Retrieval-Augmented Generation (RAG)'),
  body('RAG is not a single tool but a design pattern implemented across the AI-Server and RAG-BOT modules. The RAG implementation in this project uses a pre-built index of course notes and reference materials, an embedding model for encoding both documents and queries, and a similarity search mechanism to retrieve the most relevant chunks. These components are orchestrated by the AI-Server, which combines the retrieved context with the user\'s query into an augmented prompt for the LLM.'),
  blankLine(),
  body('The RAG approach is used because it allows the AI assistant to provide answers that are grounded in the specific materials stored by the institution, rather than relying solely on the LLM\'s parametric knowledge. This significantly reduces the probability of hallucinated or off-syllabus responses — a critical quality requirement for an academic tutoring tool.'),

  sec('4.12 Python — RAG-BOT and Fine-Tuning'),
  body('Python is used for two separate AI-related components: the RAG-BOT semantic retrieval service and the fine-tuning pipeline. Python\'s mature ecosystem for machine learning and NLP (including HuggingFace Transformers, Sentence-Transformers, FAISS, ChromaDB, and training utilities) makes it the natural choice for these tasks.'),
  blankLine(),
  body('The RAG-BOT is a lightweight Python service that exposes a /search endpoint. It loads the pre-built knowledge base index, accepts a query, computes its embedding, searches the index, and returns the top-k text chunks to the AI-Server. The fine-tuning scripts are offline utilities that prepare datasets, train LoRA adapters, and export the resulting model for use with Ollama.'),

  sec('4.13 LoRA Fine-Tuning with Unsloth and HuggingFace Transformers'),
  body('The fine-tuning pipeline uses the Unsloth library, which provides accelerated LoRA training with reduced memory consumption compared to standard HuggingFace training loops. Unsloth achieves this through custom CUDA kernels and optimized attention implementations that make LoRA training feasible even on consumer-grade GPUs [14].'),
  blankLine(),
  body('HuggingFace Transformers provides the model architecture, tokenizer, and training utilities. The SFTTrainer (Supervised Fine-Tuning Trainer) is used to train on the instruction-output dataset, with LoRA configuration specifying the rank, alpha, and target modules for adaptation. After training, the adapter is merged into the base model and exported to GGUF format for deployment with Ollama.'),
];

// ── CHAPTER 5: DESIGN AND IMPLEMENTATION ─────────────────────────────────────
const ch5 = [
  ch('Chapter 5\nSystem Design and Implementation'),

  body('This chapter provides a detailed account of how jAIcianVerse is designed and implemented. The discussion moves from the high-level system architecture through the individual subsystems — backend API design, database schema, real-time communication, AI pipeline, fine-tuning workflow, and frontend implementation — with sufficient technical depth to support evaluation and reproducibility.'),

  sec('5.1 System Architecture Overview'),
  body('jAIcianVerse is implemented as a multi-module distributed system. Each module has a defined responsibility and communicates with others through well-specified interfaces (HTTP/REST, Socket.io events, or function calls within a module). This modular design keeps responsibilities clear, allows independent testing of each module, and makes future enhancements easier to isolate.'),
  blankLine(),
  body('The five runtime modules are:'),
  blankLine(),
  bullet('Client: A React + TypeScript SPA served from Vite\'s dev server (or a static build). Communicates with Server via REST and with the Socket.io layer for real-time events. Also communicates with AI-Server for AI queries.'),
  bullet('Server: Node.js / Express backend that handles all application data operations, authentication, and real-time event orchestration via Socket.io.'),
  bullet('AI-Server: A dedicated Node.js / Express service that receives AI queries from the Client, calls RAG-BOT for retrieval, assembles the augmented prompt, and calls Ollama for generation.'),
  bullet('RAG-BOT: A Python service that maintains the semantic index of the knowledge base and serves top-k retrieval results via a /search HTTP endpoint.'),
  bullet('Ollama: Local LLM inference runtime. Loaded independently, serves models via a local HTTP API consumed by AI-Server.'),
  blankLine(),
  body('Additionally, the Fine-Tune module is an offline pipeline (not a runtime service) that prepares training data, trains LoRA adapters, and exports a deployable model. Its output is consumed by Ollama when the fine-tuned model is loaded.'),
  blankLine(),
  figCaption('Fig. 1: Overall System Architecture (High Level)'),
  body('[Architecture Diagram Placeholder — Insert exported system architecture diagram here]'),
  blankLine(),

  subsec('5.1.1 Rationale for Service Separation'),
  body('The decision to separate the AI-Server and RAG-BOT from the main Server module is deliberate. Keeping AI-related complexity out of the main application server means that changes to the retrieval strategy, model runtime, or prompt engineering do not require modifying application logic. Conversely, schema changes or new academic features on the application side do not risk disrupting the AI pipeline.'),
  blankLine(),
  body('This separation also reflects realistic production practice: AI inference is a resource-intensive operation that benefits from independent scaling. By structuring the system with clear service boundaries, the architecture is already aligned with how it would be deployed at larger scale.'),

  sec('5.2 Backend API Design'),
  body('The main backend server is built with Express.js and provides a RESTful API under a /api prefix. All routes are organized into module-specific files and mounted on the application through a central router configuration. Authentication is handled by a JWT middleware function that is applied to all protected routes.'),
  blankLine(),

  subsec('5.2.1 Route Organization'),
  tableCaption('Table 5.1: Key REST API Route Groups'),
  makeTable([
    tableRow([hdrCell('Module', 1400), hdrCell('Base Path', 1400), hdrCell('Example Endpoints', 5866)]),
    tableRow([cell('Users', 1400), cell('/api/user', 1400), cell('POST /signup, POST /login, GET /getuser-details, PUT /update-profile, GET /search-users', 5866)]),
    tableRow([cell('Discussions', 1400), cell('/api/discussions', 1400), cell('POST /upload-discussion, GET /fetch-discussion, POST /answers, POST /announcements, GET /fetch-announcements', 5866)]),
    tableRow([cell('Materials', 1400), cell('/api/materials', 1400), cell('POST /upload-notes, GET /getMaterials, PUT /upvote/:materialId, DELETE /:materialId', 5866)]),
    tableRow([cell('Answers', 1400), cell('/api/answers', 1400), cell('GET /getUserAnswers, PUT /upvote/:answerId', 5866)]),
    tableRow([cell('Chat', 1400), cell('/api/chat', 1400), cell('POST / (access/create chat), GET / (fetch user chats), POST /group, PUT /rename-group, PUT /add-member', 5866)]),
    tableRow([cell('Messages', 1400), cell('/api/message', 1400), cell('POST / (send), GET /:chatId (history), GET /:chatId/search, PUT /edit/:messageId, DELETE /:messageId', 5866)]),
    tableRow([cell('AI', 1400), cell('/api/ai (AI-Server)', 1400), cell('POST /generate, POST /rag-generate', 5866)]),
  ], [1400, 1400, 5866]),

  subsec('5.2.2 Authentication Middleware'),
  body('The JWT authentication middleware extracts the Authorization header from incoming requests, verifies the token signature using the server\'s secret key, decodes the payload, and attaches the user object to the request context. If the token is missing, expired, or invalid, the middleware returns a 401 Unauthorized response immediately, preventing the route handler from executing.'),
  blankLine(),
  body('This middleware is applied to every route that handles user-specific data or requires a known user identity. Public endpoints (signup and login) are exempt from this middleware since their purpose is to issue tokens in the first place.'),
  blankLine(),
  figCaption('Fig. 3: JWT Authentication Flow (Simplified)'),
  body('[Sequence Diagram Placeholder — Insert JWT authentication flow diagram here]'),

  subsec('5.2.3 Request Validation and Error Handling'),
  body('Each route handler validates the presence of required fields before proceeding. For example, the AI generation endpoint verifies that a prompt field is present; the message send endpoint verifies that both chatId and content are provided. Missing required fields result in a 400 Bad Request response with a descriptive message.'),
  blankLine(),
  body('Errors from database operations or downstream services are caught and returned as standardized JSON responses with appropriate HTTP status codes. This consistency makes it easier for the client to handle errors uniformly.'),

  sec('5.3 Database Design'),
  body('MongoDB is used as the document store for all application data. The database design reflects the actual workflows in the application, with each collection representing a distinct domain entity. Mongoose schemas enforce the structure of these entities and provide a programmatic interface for querying and updating them.'),
  blankLine(),

  subsec('5.3.1 Core Collections and Schema Design'),
  body('The following core collections are defined in the application:'),
  blankLine(),
  subsubsec('User Collection'),
  body('Stores user identity and profile information. Key fields include: username, email (unique, indexed), hashed password (never returned in API responses), profile picture URL, and a list of chat references. The email field is indexed to support efficient lookup during login. Passwords are hashed using a secure hashing algorithm before storage.'),
  blankLine(),
  subsubsec('Chat Collection'),
  body('Represents a conversation, either one-to-one or group. Key fields include: an isGroupChat boolean flag, a participants array (references to User documents), a latestMessage reference (for quick preview in chat lists), and for group chats: groupName, groupAdmin reference, and groupAvatar. The participants field is always an array, allowing the same schema to represent both direct and group chats.'),
  blankLine(),
  subsubsec('Message Collection'),
  body('Stores individual chat messages. Key fields include: sender reference, chat reference, content (text body), readBy array (user IDs who have read the message), isEdited boolean, and isDeleted boolean. Soft deletion (setting isDeleted to true rather than removing the document) preserves message history for read receipts and audit purposes while hiding content from the UI.'),
  blankLine(),
  subsubsec('Discussion Collection'),
  body('Stores question threads. Key fields include: title, body, author reference, associated unit or topic reference, an answers array or reference, and an upvotes counter. Associating discussions with specific units allows the UI to filter and display doubts relevant to what the student is currently studying.'),
  blankLine(),
  subsubsec('Material / Notes Collection'),
  body('Stores uploaded learning materials. Key fields include: title, description, file URL or content reference, uploaded-by reference, unit association, and an upvotedBy array to support the upvoting feature. The upvotedBy array is used for idempotent toggling — if the requesting user\'s ID is already in the array, the upvote is removed; otherwise it is added.'),
  blankLine(),
  figCaption('Fig. 6: Database Entity Relationship (Conceptual)'),
  body('[ER Diagram Placeholder — Insert conceptual ER diagram showing User, Chat, Message, Discussion, Material relationships here]'),

  sec('5.4 Real-Time Messaging Design'),
  body('Real-time communication in jAIcianVerse is implemented using Socket.io running on the same HTTP server instance as the Express application. The socket layer handles all time-sensitive, event-driven interactions, while REST handles data retrieval and persistent state updates.'),
  blankLine(),

  subsec('5.4.1 Socket Authentication'),
  body('Socket connections are authenticated during the handshake phase. When the client establishes a socket connection, it passes the JWT token in the handshake auth parameter. The server\'s Socket.io middleware intercepts the handshake, validates the token, and attaches the decoded user object to the socket session. Connections with invalid or missing tokens are rejected immediately.'),
  blankLine(),
  body('This authentication step ensures that every socket event originates from an identifiable, verified user. It prevents anonymous event injection and ensures that server-side logic can correctly attribute messages, read receipts, and group operations to specific users.'),
  blankLine(),

  subsec('5.4.2 Room-Based Event Routing'),
  body('Socket.io\'s room concept is used to route events selectively. Each chat conversation has a corresponding room (identified by the chat\'s MongoDB ID). When a user opens a chat, the client emits a join_chat event, and the server adds the socket to that room. From that point, any events emitted to that room (such as new messages or typing indicators) are delivered only to sockets that have joined it.'),
  blankLine(),
  body('This room-based routing prevents message broadcasting to all connected clients, keeping event delivery scoped to the appropriate conversation participants.'),
  blankLine(),
  tableCaption('Table 5.2: Socket Events Used for Collaboration'),
  makeTable([
    tableRow([hdrCell('Event Name', 2200), hdrCell('Direction', 1500), hdrCell('Purpose', 4966)]),
    tableRow([cell('setup', 2200), cell('Client → Server', 1500, true), cell('Initialize user\'s socket session; join all rooms the user participates in', 4966)]),
    tableRow([cell('join_chat', 2200), cell('Client → Server', 1500, true), cell('Join a specific chat room to receive its events', 4966)]),
    tableRow([cell('send_message', 2200), cell('Client → Server', 1500, true), cell('Send a new message; server persists it and broadcasts to the chat room', 4966)]),
    tableRow([cell('receive_message', 2200), cell('Server → Client', 1500, true), cell('Deliver a new message to all participants in a room', 4966)]),
    tableRow([cell('typing / stop_typing', 2200), cell('Client ↔ Server', 1500, true), cell('Signal typing state; other users in the room see the indicator', 4966)]),
    tableRow([cell('read_message / messages_read', 2200), cell('Client ↔ Server', 1500, true), cell('Mark messages as read; update read receipts for other participants', 4966)]),
    tableRow([cell('edit_message / message_edited', 2200), cell('Client ↔ Server', 1500, true), cell('Edit a sent message; update content for all participants', 4966)]),
    tableRow([cell('delete_message / message_deleted', 2200), cell('Client ↔ Server', 1500, true), cell('Soft-delete a message; hide from UI for all participants', 4966)]),
    tableRow([cell('create_group / group_created', 2200), cell('Client ↔ Server', 1500, true), cell('Create a group chat; notify all invited participants', 4966)]),
    tableRow([cell('join_group / group_updated', 2200), cell('Client ↔ Server', 1500, true), cell('Add members to a group; update group metadata', 4966)]),
    tableRow([cell('leave_group / left_group', 2200), cell('Client ↔ Server', 1500, true), cell('Remove a participant from a group; update group state', 4966)]),
    tableRow([cell('online_users', 2200), cell('Server → Client', 1500, true), cell('Broadcast the list of currently online users for presence indicators', 4966)]),
  ], [2200, 1500, 4966]),
  blankLine(),
  figCaption('Fig. 4: Real-Time Message Delivery Flow (Simplified)'),
  body('[Sequence Diagram Placeholder — Insert real-time message delivery sequence diagram here]'),

  sec('5.5 AI Subsystem Design'),
  body('The AI subsystem is split across three components: the AI-Server (orchestration layer), the RAG-BOT (retrieval service), and Ollama (generation runtime). This separation makes each component independently testable and replaceable.'),
  blankLine(),

  subsec('5.5.1 AI-Server Endpoints'),
  body('The AI-Server exposes two primary endpoints:'),
  blankLine(),
  bullet('/generate: Accepts a prompt and optional systemPrompt. Forwards directly to Ollama for generation without retrieval. Useful for general queries or when retrieval context is not required.'),
  bullet('/rag-generate: Accepts a prompt and optional systemPrompt. Calls RAG-BOT\'s /search endpoint first to retrieve relevant context, augments the system prompt with the retrieved chunks, and then calls Ollama for generation. This is the recommended endpoint for academic queries.'),

  subsec('5.5.2 RAG Pipeline'),
  body('The RAG pipeline implements a standard retrieve-then-generate architecture. When a query arrives at /rag-generate, the following sequence occurs:'),
  blankLine(),
  numbered('The AI-Server receives the query and sends it to RAG-BOT\'s /search endpoint with a configurable topK parameter.'),
  numbered('RAG-BOT encodes the query using its loaded embedding model and computes cosine similarity against all pre-indexed document chunks in the knowledge base.'),
  numbered('The top-K highest-similarity chunks are returned to the AI-Server as a JSON array of text strings.'),
  numbered('The AI-Server appends the retrieved chunks to the system prompt under a clearly labeled section: "Relevant university knowledge base context."'),
  numbered('The augmented prompt is sent to Ollama\'s /api/generate endpoint.'),
  numbered('Ollama generates and streams back a response, which is returned to the client.'),
  blankLine(),
  figCaption('Fig. 2: RAG Generation Flow'),
  body('[Sequence Diagram Placeholder — Insert RAG generation sequence diagram here]'),

  subsec('5.5.3 Retrieval Mathematics'),
  body('The retrieval step is based on cosine similarity between dense vector embeddings. Let q ∈ R^d represent the embedding of the user query, and c_i ∈ R^d represent the embedding of the i-th knowledge base chunk. The cosine similarity score is computed as:'),
  blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: 'sim(q, c_i) = (q · c_i) / (||q|| × ||c_i||)', font: TNR, size: 24, italics: true })] }),
  blankLine(),
  body('The system retrieves the top-k chunks with the highest similarity scores:'),
  blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: '{c_1, ..., c_k} = TopK_i [ sim(q, c_i) ]', font: TNR, size: 24, italics: true })] }),
  blankLine(),
  body('These retrieved chunks are concatenated and prepended to the generation prompt as contextual grounding material. The language model generates the final response token-by-token conditioned on the combined prompt, where the probability of generating token y_t is modeled as:'),
  blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: 'P(y_t | y_<t, x) = softmax(z_t)', font: TNR, size: 24, italics: true })] }),
  blankLine(),
  body('Here, x denotes the combined prompt (system instruction + retrieved context + user query), y_<t represents all previously generated tokens, and z_t is the output logit vector at step t.'),

  subsec('5.5.4 Fallback Behavior'),
  body('If the RAG-BOT service is unavailable (network error, timeout, or service restart), the AI-Server catches the retrieval failure and proceeds to call Ollama directly without appended context. This graceful degradation ensures that the user still receives a response, with the trade-off that it may be less specific to the course content. In the future, this fallback behavior could be signaled to the user with a note indicating that retrieval was unavailable.'),

  sec('5.6 Fine-Tuning Pipeline'),
  body('The fine-tuning pipeline is an offline workflow that produces a domain-adapted language model from course materials. It consists of four stages: knowledge extraction and dataset creation, LoRA adapter training, model merging, and GGUF export.'),
  blankLine(),
  figCaption('Fig. 5: Fine-Tuning and Export Pipeline'),
  body('[Pipeline Diagram Placeholder — Insert fine-tuning pipeline flowchart here]'),
  blankLine(),

  subsec('5.6.1 Dataset Preparation'),
  body('The training dataset is prepared in JSONL (JSON Lines) format, where each line is a JSON object with an instruction field (the question or prompt) and an output field (the expected answer). These pairs are derived from course notes by either manually authoring representative Q&A pairs or using an automated extraction script that breaks notes into chunks and generates questions from them.'),
  blankLine(),
  body('The quality of the training dataset has a direct impact on fine-tuning outcomes. Pairs that clearly demonstrate the expected response style (structured, explanation-focused, course-appropriate) contribute more signal than ambiguous or overly short examples. For this project, the dataset is curated to include a representative cross-section of topics from the course material.'),

  subsec('5.6.2 LoRA Training'),
  body('The LoRA training process uses the Unsloth-accelerated SFTTrainer. Key configuration parameters include the LoRA rank (r), the scaling factor alpha, the target modules to adapt (typically the attention weight matrices: q_proj, v_proj, k_proj, o_proj, and optionally the MLP layers), and training hyperparameters such as learning rate, batch size, and number of epochs.'),
  blankLine(),
  body('The mathematical formulation of LoRA introduces the weight update as a low-rank matrix decomposition. For a weight matrix W ∈ R^(m×n) in the base model, the adapted weight during fine-tuning is:'),
  blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: "W' = W + ΔW,    where ΔW = B × A", font: TNR, size: 24, italics: true })] }),
  blankLine(),
  body('Here A ∈ R^(r×n) and B ∈ R^(m×r) with rank r << min(m, n). The base model weight W is frozen during training; only A and B are learned. The number of trainable parameters introduced by this adapter is approximately r × (m + n), which is orders of magnitude smaller than the full matrix m × n for large models [15].'),
  blankLine(),
  body('The training objective is standard supervised fine-tuning: minimize the negative log-likelihood of the target token sequence y_1, ..., y_T given the input prompt x:'),
  blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: 'L(θ) = - Σ(t=1 to T) log P_θ(y_t | y_<t, x)', font: TNR, size: 24, italics: true })] }),
  blankLine(),
  body('where θ represents the trainable parameters — in the LoRA setting, primarily the adapter matrices A and B for each targeted weight matrix.'),

  subsec('5.6.3 Export and Integration'),
  body('After training, the LoRA adapter weights are merged back into the base model weights (W_merged = W + B × A) to produce a standalone model that does not require the adapter infrastructure at inference time. The merged model is then quantized and exported to the GGUF format, which is the standard model format consumed by llama.cpp-based inference runtimes including Ollama.'),
  blankLine(),
  body('The exported GGUF file is loaded into Ollama using the Modelfile configuration. Once loaded, the fine-tuned model is available as a named model in the Ollama runtime and can be selected in the AI-Server configuration with no further changes to the application code.'),

  sec('5.7 Frontend Design and Implementation'),
  body('The frontend is a React + TypeScript single-page application built with Vite. It is organized into pages and reusable components, with application state managed primarily through React Hooks and a shared context where appropriate (for example, the authenticated user\'s identity is kept in a context so all components can access it without prop drilling).'),
  blankLine(),

  subsec('5.7.1 Application Pages'),
  body('The application consists of the following major pages:'),
  blankLine(),
  bullet('Login and Signup: Authentication forms with client-side validation and feedback for common errors.'),
  bullet('Home / Dashboard: Entry point after login; shows navigation to key modules.'),
  bullet('Materials / Notes: Displays available learning materials organized by unit. Supports upvoting and navigation to specific materials.'),
  bullet('Discussions / Q&A: Lists discussion threads; allows creating new threads and posting answers.'),
  bullet('Chat: Full-featured messaging interface with contact/group management, real-time message delivery, and read receipts.'),
  bullet('AI Assistant: Input interface for posing queries to the AI assistant, with response display and optional source context toggle.'),
  blankLine(),

  subsec('5.7.2 Client-Server Communication'),
  body('The client communicates with the Server via standard fetch or Axios HTTP calls, attaching the stored JWT token in the Authorization header. Socket.io communication is initialized once after login and reused across all pages that require real-time updates (primarily the chat page). The AI-Server is called directly from the client for AI queries, keeping the main Server decoupled from AI-specific interactions.'),
  blankLine(),

  subsec('5.7.3 State Management'),
  body('Application state is managed at multiple levels. Component-level state (useStateHook) handles UI-specific state such as form inputs, loading indicators, and toggled elements. Shared application state — specifically the authenticated user object and the current active chat — is managed through React Context to avoid passing these values as props through multiple component layers. Real-time state (incoming messages, typing events) is handled directly within the socket event handlers, which update local state to trigger re-renders.'),
];

// ── CHAPTER 6: RESULTS ───────────────────────────────────────────────────────
const ch6 = [
  ch('Chapter 6\nResults and Discussion'),

  body('This chapter presents the outcomes of implementing and evaluating jAIcianVerse. The evaluation approach is practical and appropriate for an academic project: it combines feature-level functional validation, scenario-based qualitative assessment of AI behavior, and an honest discussion of observed performance characteristics and limitations. Large-scale quantitative user studies are beyond the scope of this project and are identified as future work.'),

  sec('6.1 Module-wise Functional Outcomes'),

  subsec('6.1.1 User Authentication and Profile'),
  body('The authentication module was validated by testing the complete user lifecycle: registration, login with correct credentials, login with incorrect credentials, accessing protected endpoints with and without valid tokens, and profile update operations.'),
  blankLine(),
  body('Correct credential login successfully returns a JWT, which is then used in all subsequent requests. Requests to protected endpoints without a valid token are rejected with 401 status, confirming that the middleware is correctly applied. Profile update operations correctly persist changes and return the updated user object.'),
  blankLine(),
  body('One important observation is that the token-based authentication model scales well to both REST and socket contexts: the same token used for API calls is also used for socket handshake authentication, meaning a single login event establishes identity across the entire application without any additional authentication step for real-time features.'),
  blankLine(),
  figCaption('Fig. 7: Login Page Screenshot'),
  body('[Screenshot Placeholder — Insert login page screenshot here]'),
  blankLine(),
  figCaption('Fig. 8: Signup Page Screenshot'),
  body('[Screenshot Placeholder — Insert signup page screenshot here]'),
  blankLine(),

  subsec('6.1.2 Academic Discussions and Announcements'),
  body('The discussion module supports creating threads, listing existing threads, and posting answers. Validation confirmed that discussion threads are correctly persisted with their author association and that the answer count updates when a new answer is posted.'),
  blankLine(),
  body('Announcements are stored and retrieved as broadcast messages. In testing, announcements created by one user appeared correctly in the listing for all connected users upon page refresh.'),
  blankLine(),
  body('From a learning workflow perspective, the discussion module serves an important function: it provides a permanent, searchable record of doubts and answers that students can revisit. This contrasts with chat — where questions can easily get buried in conversation history — and with the AI assistant — where interactions are transient unless explicitly saved.'),
  blankLine(),
  figCaption('Fig. 11: Discussions / Q&A Module Screenshot'),
  body('[Screenshot Placeholder — Insert discussions module screenshot here]'),
  blankLine(),

  subsec('6.1.3 Materials and Learning Content'),
  body('The materials module allows uploading notes and retrieving a list of available materials, organized by upload date and unit association. Upvoting was validated by confirming that a user\'s upvote is toggled correctly (added on first click, removed on second click) and that the upvote count is reflected accurately in the response.'),
  blankLine(),
  body('The materials module also serves as the source of content for the RAG knowledge base. When course notes are uploaded as materials, they can subsequently be processed into the retrieval index, creating a direct connection between what the institution provides as learning resources and what the AI assistant can use for grounded answering.'),
  blankLine(),
  figCaption('Fig. 10: Materials / Notes Module Screenshot'),
  body('[Screenshot Placeholder — Insert materials module screenshot here]'),
  blankLine(),

  subsec('6.1.4 Real-Time Chat and Messaging'),
  body('The chat module was tested across several scenarios: one-to-one message delivery, group creation and multi-participant delivery, typing indicators, read receipts, message editing, and soft deletion.'),
  blankLine(),
  body('In all cases, messages sent by one client were delivered to the other participating clients in real time (within the sub-second range in a local network setup). The typing indicator appeared and cleared correctly in response to the corresponding socket events. Read receipts were updated when the read_message event was emitted with the correct message IDs.'),
  blankLine(),
  body('Message editing and soft deletion were confirmed to update the stored document in MongoDB correctly: edited messages reflect the new content with the isEdited flag set to true, and soft-deleted messages have isDeleted set to true but remain in the database (they are filtered or replaced with a "message deleted" placeholder in the UI).'),
  blankLine(),
  figCaption('Fig. 12: Chat Module Screenshot'),
  body('[Screenshot Placeholder — Insert chat module screenshot here]'),
  blankLine(),
  figCaption('Fig. 9: Home / Dashboard Screenshot'),
  body('[Screenshot Placeholder — Insert home/dashboard screenshot here]'),
  blankLine(),

  subsec('6.1.5 AI Assistant — RAG and Direct Generation'),
  body('The AI assistant was evaluated both in direct generation mode (/generate) and in RAG mode (/rag-generate). In direct generation mode, the model answers from its own parametric knowledge without any course-specific context. In RAG mode, relevant chunks from the knowledge base are retrieved and appended to the system prompt before generation.'),
  blankLine(),
  body('Qualitative testing across several topic areas showed a clear difference between the two modes. In RAG mode, answers referenced specific content from the indexed notes and used terminology consistent with the course material. In direct mode, answers were more general and occasionally used different terminology than the course material, even when technically correct.'),
  blankLine(),
  body('This confirms the primary hypothesis behind the RAG design: grounding generation in course-specific context produces answers that are more aligned with what the course actually teaches, even though the underlying language model is the same in both cases.'),
  blankLine(),
  figCaption('Fig. 13: AI Assistant Response (RAG Example) Screenshot'),
  body('[Screenshot Placeholder — Insert AI assistant RAG response screenshot here]'),

  sec('6.2 Feature Validation Summary'),
  tableCaption('Table 6.1: Feature Validation Summary'),
  makeTable([
    tableRow([hdrCell('Sl. No.', 500), hdrCell('Feature', 2000), hdrCell('Test Action', 2500), hdrCell('Expected Outcome', 3666)]),
    tableRow([cell('1', 500, true), cell('User Signup', 2000), cell('Submit valid registration form', 2500), cell('Account created; user can login with registered credentials', 3666)]),
    tableRow([cell('2', 500, true), cell('User Login', 2000), cell('Submit valid credentials', 2500), cell('JWT token returned; protected routes accessible', 3666)]),
    tableRow([cell('3', 500, true), cell('Protected Route Access', 2000), cell('Call protected endpoint without token', 2500), cell('401 Unauthorized returned; data not exposed', 3666)]),
    tableRow([cell('4', 500, true), cell('Post Discussion', 2000), cell('Create discussion thread with title and body', 2500), cell('Thread persisted; visible in discussions list', 3666)]),
    tableRow([cell('5', 500, true), cell('Post Answer', 2000), cell('Submit answer to an existing thread', 2500), cell('Answer stored and visible under the thread', 3666)]),
    tableRow([cell('6', 500, true), cell('Upload Material', 2000), cell('Upload a notes file with metadata', 2500), cell('Material stored and visible in materials listing', 3666)]),
    tableRow([cell('7', 500, true), cell('Upvote Material/Answer', 2000), cell('Click upvote button twice on same item', 2500), cell('Upvote added on first click; removed on second (toggle)', 3666)]),
    tableRow([cell('8', 500, true), cell('Real-time Message', 2000), cell('Send message from one client', 2500), cell('Recipient receives receive_message event; message in DB', 3666)]),
    tableRow([cell('9', 500, true), cell('Typing Indicator', 2000), cell('Start typing in chat input', 2500), cell('Other participants see typing indicator appear and clear', 3666)]),
    tableRow([cell('10', 500, true), cell('Read Receipt', 2000), cell('Emit read_message event with message IDs', 2500), cell('messages_read event sent; read status updated in DB', 3666)]),
    tableRow([cell('11', 500, true), cell('Message Edit', 2000), cell('Edit a sent message', 2500), cell('Updated content reflected; isEdited flag set to true', 3666)]),
    tableRow([cell('12', 500, true), cell('Message Soft Delete', 2000), cell('Delete a sent message', 2500), cell('isDeleted set to true; placeholder shown in UI', 3666)]),
    tableRow([cell('13', 500, true), cell('Direct AI Generation', 2000), cell('Query via /generate endpoint', 2500), cell('LLM response returned without retrieval context', 3666)]),
    tableRow([cell('14', 500, true), cell('RAG Generation', 2000), cell('Query via /rag-generate endpoint', 2500), cell('Response generated with retrieved context; course-aligned', 3666)]),
    tableRow([cell('15', 500, true), cell('RAG Fallback', 2000), cell('Query RAG endpoint with RAG-BOT offline', 2500), cell('Response still generated; no hard failure returned', 3666)]),
  ], [500, 2000, 2500, 3666]),

  sec('6.3 AI Evaluation'),

  subsec('6.3.1 Retrieval Quality'),
  body('The quality of RAG-based answers depends fundamentally on the retrieval step retrieving the right content. While a formal labeled evaluation dataset was not constructed for this academic version, qualitative assessment was performed by posing questions on topics present in the knowledge base and observing whether the retrieved chunks were topically relevant.'),
  blankLine(),
  body('In cases where the question topic was clearly present in the indexed notes, the retrieval was consistently relevant. In cases where the topic was only tangentially related to the stored content, retrieval quality was lower and the generated response was correspondingly less specific. This confirms that knowledge base completeness is the primary driver of retrieval quality.'),
  blankLine(),
  body('The Recall@k metric provides a formal way to quantify retrieval quality if a labeled set is available. If there are R truly relevant chunks in the knowledge base for a given query, and r_k of them appear in the retrieved top-k, then:'),
  blankLine(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 }, children: [new TextRun({ text: 'Recall@k = r_k / R', font: TNR, size: 24, italics: true })] }),
  blankLine(),
  body('Constructing a labeled evaluation set for Recall@k measurement is identified as a concrete future improvement.'),

  subsec('6.3.2 Qualitative AI Scenarios'),
  tableCaption('Table 6.2: Representative AI Usage Scenarios'),
  makeTable([
    tableRow([hdrCell('Scenario', 1800), hdrCell('Example Query', 2400), hdrCell('What a Good Response Includes', 4466)]),
    tableRow([cell('Concept Explanation', 1800), cell('Explain the concept of [topic] in simple terms.', 2400), cell('Clear definition, example, connection to course objectives; avoids off-syllabus tangents.', 4466)]),
    tableRow([cell('Quick Revision', 1800), cell('Give me a short summary of Unit [X].', 2400), cell('5–8 key points covering the unit\'s main ideas; consistent with stored notes.', 4466)]),
    tableRow([cell('Problem Walkthrough', 1800), cell('How do I approach solving [type of problem]?', 2400), cell('Structured step-by-step guidance; correct method aligned with what the course teaches.', 4466)]),
    tableRow([cell('Syllabus Alignment Check', 1800), cell('Is [concept] part of our syllabus?', 2400), cell('Answer based on stored notes; explicit acknowledgement if topic not found in knowledge base.', 4466)]),
    tableRow([cell('Comparison Query', 1800), cell('What is the difference between [A] and [B]?', 2400), cell('Side-by-side comparison of key characteristics; references examples from course material.', 4466)]),
  ], [1800, 2400, 4466]),

  subsec('6.3.3 Fine-Tuning Outcomes'),
  body('The fine-tuning pipeline was executed end-to-end: the dataset was prepared from course notes, LoRA adapters were trained using Unsloth with the SFTTrainer, the adapter was merged into the base model, and the result was exported to GGUF format and loaded into Ollama.'),
  blankLine(),
  body('Qualitative comparison between the base model and the fine-tuned model on domain-specific queries showed that the fine-tuned model produced responses with a more consistent academic tone, used terminology more aligned with the course material, and was less likely to introduce unrelated information when answering focused questions.'),
  blankLine(),
  body('It is important to emphasize that fine-tuning is not a substitute for RAG in this architecture. Fine-tuning improves the model\'s behavior and style; RAG provides the factual grounding. Together, they address complementary aspects of answer quality.'),

  sec('6.4 Performance and Usability Observations'),
  body('The following performance and usability observations were made during development and testing in a local demonstration setup:'),
  blankLine(),
  subsubsec('API Response Times'),
  body('Standard REST operations such as fetching chat history, retrieving materials, and loading discussion threads completed within acceptable response times in a local network environment. No significant latency issues were observed during normal operation.'),
  blankLine(),
  subsubsec('Real-Time Latency'),
  body('Socket.io event delivery was effectively instantaneous in the local test environment. Messages sent by one client appeared on the recipient\'s screen within milliseconds, and typing indicators appeared and cleared with no perceptible delay. This real-time responsiveness significantly improves the chat experience compared to polling-based approaches.'),
  blankLine(),
  subsubsec('AI Response Time'),
  body('AI response latency depends heavily on the model size and the available hardware. On a workstation with a mid-range GPU, response times for typical academic queries ranged from 2–8 seconds. On CPU-only inference, this ranged from 15–45 seconds depending on response length. The application handles this by showing a loading indicator while the response streams in.'),
  blankLine(),
  subsubsec('UI Feedback'),
  body('The React frontend provides appropriate loading states (spinners, disabled submit buttons) for all asynchronous operations. Error messages from the backend are surfaced to the user as readable notifications rather than raw HTTP error codes.'),

  sec('6.5 Limitations'),
  body('The following limitations are acknowledged as characteristics of the current academic-scale implementation. They are not design flaws, but boundaries of what was undertaken:'),
  blankLine(),
  bullet('Knowledge base dependency: The quality and completeness of the RAG knowledge base directly bounds the quality of AI responses. Thin or outdated notes will produce answers that are correspondingly limited. Ongoing curation of the knowledge base is required for sustained usefulness.'),
  bullet('No formal correctness guarantee: Even with RAG grounding and domain fine-tuning, language models can still produce plausible-sounding but incorrect answers, particularly for edge-case queries. Students are advised to verify important information with course materials.'),
  bullet('Compute requirements for fine-tuning: The LoRA training step requires hardware (ideally a GPU) that may not be available to all users. Training on a CPU is possible but impractically slow for most base model sizes.'),
  bullet('Limited evaluation formalism: The evaluation presented in this chapter is primarily qualitative and scenario-based. A rigorous quantitative evaluation (automated metrics, blind rating by domain experts, formal user studies) would require resources beyond the scope of this academic project.'),
  bullet('No multi-modal support: The current AI assistant handles text-only queries. Image-based questions (e.g., "explain this circuit diagram") are not supported.'),
  bullet('Single-language interface: The platform is currently English-only. Regional language support would be a significant enhancement for accessibility in India.'),
];

// ── CHAPTER 7: CONCLUSION ────────────────────────────────────────────────────
const ch7 = [
  ch('Chapter 7\nConclusion and Future Scope'),

  sec('7.1 Conclusion'),
  body('jAIcianVerse was conceived as a response to a real and common frustration in college learning: the fragmentation of tools and the unreliability of generic AI assistants in academic contexts. This project demonstrates that it is possible to build a cohesive academic platform that addresses both of these problems simultaneously, within the scope and resources of an academic final-year project.'),
  blankLine(),
  body('The platform integrates structured academic content management (units, materials, announcements), structured collaborative doubt-solving (discussion threads and answers), real-time communication (Socket.io-powered chat with full messaging features), and a grounded AI assistant — all accessible through a single, consistently designed web interface.'),
  blankLine(),
  body('The AI assistant component is the most technically distinctive part of the project. By combining Retrieval-Augmented Generation with a LoRA fine-tuned language model, the system produces answers that are simultaneously grounded in course-specific content (through retrieval) and stylistically appropriate for an academic tutoring context (through fine-tuning). This dual approach addresses the two most common failure modes of educational AI: factual unreliability and generic, unhelpful tone.'),
  blankLine(),
  body('From a software engineering perspective, the modular architecture of the system — with clearly separated Client, Server, AI-Server, RAG-BOT, and Fine-Tune components — demonstrates good design principles. Each module can be developed, tested, and updated independently. The choice of widely-used, open-source technologies across the stack (React, Node.js, MongoDB, Socket.io, Python, HuggingFace, Ollama) ensures that the project is both reproducible and extensible without proprietary dependencies.'),
  blankLine(),
  body('In summary, jAIcianVerse successfully demonstrates how full-stack web development and modern AI techniques can be combined to produce a useful, trustworthy academic collaboration tool. The project contributes both a working system and a clear architectural template for similar academic AI platforms.'),

  sec('7.2 Future Scope'),
  body('The current implementation establishes a strong foundation. Several clearly defined enhancements would significantly extend the platform\'s value in future iterations:'),
  blankLine(),

  subsec('7.2.1 Knowledge Base Ingestion Pipeline'),
  body('Currently, the knowledge base must be prepared manually from text files. A future enhancement would be an automated ingestion pipeline that accepts PDF and DOCX uploads (the same materials uploaded through the materials module), extracts and chunks the text, and indexes it into the RAG retrieval store without manual intervention. This would create a direct, automated connection between what faculty upload as course materials and what the AI assistant can reference — ensuring the knowledge base stays current throughout the semester.'),

  subsec('7.2.2 Improved Retrieval and Hybrid Search'),
  body('The current retrieval step uses pure vector similarity search. A significant improvement would be to introduce hybrid search, combining dense vector retrieval with sparse keyword retrieval (BM25 or TF-IDF). Hybrid search can perform better on queries with rare or domain-specific terms that embedding models may not represent well in the vector space. Additionally, metadata-aware filtering (retrieving only chunks associated with the current unit being studied) would improve precision.'),

  subsec('7.2.3 Source Attribution in AI Responses'),
  body('A key trust-building feature would be displaying which specific knowledge base chunks influenced each AI response. This "sources" view would allow students to verify answers against the original notes directly, increasing transparency and reinforcing the connection between AI assistance and course materials.'),

  subsec('7.2.4 Formal Evaluation Framework'),
  body('Establishing a formal evaluation framework — including a labeled question-answer dataset for the RAG retrieval step (enabling Recall@k and Precision@k measurements), and human-rated answer quality scores — would enable systematic comparison of different retrieval strategies, model variants, and prompt engineering approaches. This would transform the qualitative validation in this report into quantitative, reproducible results.'),

  subsec('7.2.5 Role-Based Access and Academic Workflows'),
  body('Extending the user model to explicitly support distinct faculty and student roles would enable more powerful academic workflows: faculty-only material publishing, instructor-reviewed answers appearing with a verified badge, moderation tools for discussion forums, and content approval pipelines before materials become visible to students.'),

  subsec('7.2.6 Mobile Application'),
  body('A React Native or Progressive Web App (PWA) version of jAIcianVerse would extend access to students on mobile devices, which are often the primary computing device for students in India. PWA technology in particular could provide offline access to cached materials, making the platform useful even in low-connectivity environments.'),

  subsec('7.2.7 Production Deployment and Scalability'),
  body('Moving the platform from a development setup to a production deployment would involve containerizing services with Docker, orchestrating them with Kubernetes or a managed cloud service, setting up a robust MongoDB cluster, adding API rate limiting and monitoring, and configuring HTTPS with proper certificate management. The modular architecture already aligns well with these production deployment patterns.'),

  subsec('7.2.8 Multilingual Support'),
  body('Adding support for regional languages — particularly Kannada, Hindi, and Tamil given the geographic location of JSS STU — would significantly improve accessibility for students who are more comfortable expressing doubts in their native language. This would require multilingual embedding models for retrieval and either multilingual fine-tuning or translation-aware prompting for generation.'),
];

// ── REFERENCES ────────────────────────────────────────────────────────────────
const refsPage = [
  ch('References'),
  body('References are listed in the order of first occurrence in the report, following APA format.'),
  blankLine(),

  bodyPara([run('[1] Gligorea, I., Cioca, M., Oancea, R., Gorski, A.-T., Gorski, H., & Tudorache, P. (2024). Adaptive learning using artificial intelligence in e-learning: A literature review. '), runItalic('Education Sciences, 13'), run('(12), 1216.')]),
  blankLine(),
  bodyPara([run('[2] Dong, C., Yuan, Y., Chen, K., Cheng, S., & Wen, C. (2023). How to build an adaptive AI tutor for any course using knowledge graph-enhanced retrieval-augmented generation. '), runItalic('Manuscript.'), run(' (Add publication URL/DOI before final submission.)')]),
  blankLine(),
  bodyPara([run('[3] Mayer, R. E. (2009). '), runItalic('Multimedia learning'), run(' (2nd ed.). Cambridge University Press.')]),
  blankLine(),
  bodyPara([run('[4] Seo, K., Tang, J., Roll, I., Fels, S., & Yoon, D. (2021). The impact of artificial intelligence on learner–instructor interaction in online learning. '), runItalic('International Journal of Educational Technology in Higher Education, 18'), run('(1), 54.')]),
  blankLine(),
  bodyPara([run('[5] Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W.-T., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. '), runItalic('Advances in Neural Information Processing Systems (NeurIPS).'), run(' (Add DOI before final submission.)')]),
  blankLine(),
  bodyPara([run('[6] MongoDB, Inc. (n.d.). '), runItalic('MongoDB documentation.'), run(' Retrieved April 29, 2026, from https://www.mongodb.com/docs/')]),
  blankLine(),
  bodyPara([run('[7] Node.js contributors. (n.d.). '), runItalic('Node.js documentation.'), run(' Retrieved April 29, 2026, from https://nodejs.org/en/docs')]),
  blankLine(),
  bodyPara([run('[8] Express.js contributors. (n.d.). '), runItalic('Express documentation.'), run(' Retrieved April 29, 2026, from https://expressjs.com/')]),
  blankLine(),
  bodyPara([run('[9] Socket.IO contributors. (n.d.). '), runItalic('Socket.IO documentation.'), run(' Retrieved April 29, 2026, from https://socket.io/docs/')]),
  blankLine(),
  bodyPara([run('[10] React contributors. (n.d.). '), runItalic('React documentation.'), run(' Retrieved April 29, 2026, from https://react.dev/')]),
  blankLine(),
  bodyPara([run('[11] Vite contributors. (n.d.). '), runItalic('Vite documentation.'), run(' Retrieved April 29, 2026, from https://vitejs.dev/guide/')]),
  blankLine(),
  bodyPara([run('[12] Tailwind Labs. (n.d.). '), runItalic('Tailwind CSS documentation.'), run(' Retrieved April 29, 2026, from https://tailwindcss.com/docs')]),
  blankLine(),
  bodyPara([run('[13] Ollama contributors. (n.d.). '), runItalic('Ollama documentation.'), run(' Retrieved April 29, 2026, from https://ollama.com/')]),
  blankLine(),
  bodyPara([run('[14] Unsloth contributors. (n.d.). '), runItalic('Unsloth documentation / repository.'), run(' Retrieved April 29, 2026, from https://github.com/unslothai/unsloth')]),
  blankLine(),
  bodyPara([run('[15] Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L., & Chen, W. (2021). LoRA: Low-rank adaptation of large language models. '), runItalic('arXiv preprint arXiv:2106.09685.'), run(' https://arxiv.org/abs/2106.09685')]),
];

// ── APPENDICES ────────────────────────────────────────────────────────────────
const appendices = [
  ch('Appendix A – Project Team Details'),
  tableCaption('Table IX: Project Team Details'),
  makeTable([
    tableRow([hdrCell('Sl. No.', 600), hdrCell('Name', 1800), hdrCell('USN', 1600), hdrCell('Email ID', 2200), hdrCell('Contribution', 2466)]),
    tableRow([cell('1', 600, true), cell('(Name 1)', 1800), cell('(USN 1)', 1600), cell('(email@jssstu.ac.in)', 2200), cell('Backend (Server, APIs, Socket.io)', 2466)]),
    tableRow([cell('2', 600, true), cell('(Name 2)', 1800), cell('(USN 2)', 1600), cell('(email@jssstu.ac.in)', 2200), cell('Frontend (React, TypeScript, UI)', 2466)]),
    tableRow([cell('3', 600, true), cell('(Name 3)', 1800), cell('(USN 3)', 1600), cell('(email@jssstu.ac.in)', 2200), cell('AI Subsystem (RAG-BOT, AI-Server)', 2466)]),
    tableRow([cell('4', 600, true), cell('(Name 4)', 1800), cell('(USN 4)', 1600), cell('(email@jssstu.ac.in)', 2200), cell('Fine-Tuning Pipeline & Integration', 2466)]),
  ], [600, 1800, 1600, 2200, 2466]),

  pageBreak(),
  ch('Appendix B – COs, POs and PSOs Mapping (20CS83P)'),
  body('Course Outcomes:'),
  blankLine(),
  bodyPara([runBold('CO1: '), run('Formulate the problem definition, conduct a thorough literature review, and apply systematic requirements analysis to produce a well-defined project specification.')]),
  bodyPara([runBold('CO2: '), run('Design and implement algorithms and system architectures to solve the formulated problem, incorporating appropriate tools and technologies.')]),
  bodyPara([runBold('CO3: '), run('Evaluate the implemented system through structured testing and scenario-based validation; present and defend the major findings of the project.')]),
  blankLine(),
  tableCaption('Table X: CO, PO and PSO Mapping for Project Work (20CS83P)'),
  makeTable([
    tableRow([hdrCell('Subject', 1200), hdrCell('Code', 800), hdrCell('CO', 600), hdrCell('PO1', 500), hdrCell('PO2', 500), hdrCell('PO3', 500), hdrCell('PO4', 500), hdrCell('PO5', 500), hdrCell('PO6', 500), hdrCell('PO7', 500), hdrCell('PO8', 500), hdrCell('PO9', 500), hdrCell('PO10', 500), hdrCell('PO11', 500), hdrCell('PO12', 500), hdrCell('PSO1', 500), hdrCell('PSO2', 500), hdrCell('PSO3', 500), hdrCell('PSO4', 566)]),
    tableRow([cell('Project Work', 1200), cell('20CS83P', 800), cell('CO1', 600), cell('3', 500, true), cell('3', 500, true), cell('2', 500, true), cell('3', 500, true), cell('2', 500, true), cell('3', 500, true), cell('2', 500, true), cell('2', 500, true), cell('1', 500, true), cell('2', 500, true), cell('2', 500, true), cell('2', 500, true), cell('2', 500, true), cell('1', 500, true), cell('2', 500, true), cell('2', 500, true), cell('2', 566, true)]),
    tableRow([cell('', 1200), cell('', 800), cell('CO2', 600), cell('3', 500, true), cell('2', 500, true), cell('3', 500, true), cell('2', 500, true), cell('3', 500, true), cell('2', 500, true), cell('2', 500, true), cell('2', 500, true), cell('1', 500, true), cell('2', 500, true), cell('2', 500, true), cell('2', 500, true), cell('3', 500, true), cell('3', 500, true), cell('2', 500, true), cell('2', 566, true)]),
    tableRow([cell('', 1200), cell('', 800), cell('CO3', 600), cell('2', 500, true), cell('2', 500, true), cell('2', 500, true), cell('2', 500, true), cell('2', 500, true), cell('2', 500, true), cell('1', 500, true), cell('1', 500, true), cell('3', 500, true), cell('3', 500, true), cell('3', 500, true), cell('3', 500, true), cell('2', 500, true), cell('2', 500, true), cell('3', 500, true), cell('2', 566, true)]),
  ], [1200, 800, 600, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 566]),
  blankLine(),
  body('Note: 0 – Not Applicable, 1 – Low Relevance, 2 – Medium Relevance, 3 – High Relevance.'),

  pageBreak(),
  ch('Appendix C – Plagiarism Check Certificate'),
  body('Attach the Turnitin or iThenticate plagiarism report here in the final printed/digital submission.'),
  blankLine(),
  body('Similarity Index: _______ %'),
  body('Permissible Limit: < 20%'),
  body('Tool Used: Turnitin / iThenticate'),
  body('Checked by: (Guide Name / Designation)'),
  body('Date: _______________________'),

  pageBreak(),
  ch('Appendix D – Screenshots and Output Evidence'),
  body('The following screenshots provide visual evidence of the implemented platform features. All screenshots were captured from the working system during functional validation. Replace placeholder text below with actual screenshots before final submission.'),
  blankLine(),
  figCaption('Fig. 7: Login Page Screenshot'),
  body('[Insert Login Page Screenshot Here]'),
  blankLine(),
  figCaption('Fig. 8: Signup Page Screenshot'),
  body('[Insert Signup Page Screenshot Here]'),
  blankLine(),
  figCaption('Fig. 9: Home / Dashboard Screenshot'),
  body('[Insert Home/Dashboard Screenshot Here]'),
  blankLine(),
  figCaption('Fig. 10: Materials / Notes Module Screenshot'),
  body('[Insert Materials Module Screenshot Here]'),
  blankLine(),
  figCaption('Fig. 11: Discussions / Q&A Module Screenshot'),
  body('[Insert Discussions Module Screenshot Here]'),
  blankLine(),
  figCaption('Fig. 12: Chat Module Screenshot'),
  body('[Insert Chat Module Screenshot Here]'),
  blankLine(),
  figCaption('Fig. 13: AI Assistant Response (RAG Example) Screenshot'),
  body('[Insert AI Assistant RAG Response Screenshot Here]'),
];

// ════════════════════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ════════════════════════════════════════════════════════════════════════════
const allContent = [
  ...titlePage,
  ...certificatePage,
  ...plagiarismPage,
  ...declarationPage,
  ...acknowledgementPage,
  ...abstractPage,
  ...listOfTablesPage,
  ...listOfFigsPage,
  ...ch1,
  ...ch2,
  ...ch3,
  ...ch4,
  ...ch5,
  ...ch6,
  ...ch7,
  ...refsPage,
  ...appendices,
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
    ]
  },
  styles: {
    default: {
      document: { run: { font: TNR, size: 24 } }
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: TNR },
        paragraph: { spacing: { before: 480, after: 320 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: TNR },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: TNR },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: { size: PAGE.size, margin: PAGE.margin }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
          children: [new TextRun({ text: 'jAIcianVerse – AI-Powered Academic Collaboration and Tutoring Platform', font: TNR, size: 20, italics: true })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
          children: [
            new TextRun({ text: 'Department of Computer Science & Engineering | JSS Science and Technology University, Mysuru — Page ', font: TNR, size: 18 }),
            new TextRun({ children: [PageNumber.CURRENT], font: TNR, size: 18 }),
          ]
        })]
      })
    },
    children: allContent
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('jAIcianVerse_Final_Report.docx', buf);
  console.log('Done!');
}).catch(err => {
  console.error(err);
  process.exit(1);
});