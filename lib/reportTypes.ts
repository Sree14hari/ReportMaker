// lib/reportTypes.ts

export type SectionType =
  | 'title-page'
  | 'certificate'
  | 'declaration'
  | 'acknowledgement'
  | 'abstract'
  | 'table-of-contents'
  | 'list-of-figures'
  | 'list-of-tables'
  | 'chapter'
  | 'results'
  | 'advantages-disadvantages'
  | 'conclusion'
  | 'references';

export interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  chapterNumber?: number;
}

export interface ReportMeta {
  title: string;
  headerContent?: string;
  subtitle: string;
  studentNames: { name: string; rollNo: string }[];
  universityName: string;
  degree: string;
  branch: string;
  collegeName: string;
  collegeShort: string;
  department: string;
  departmentShort: string;
  month: string;
  year: string;
  guideName: string;
  guideDesignation: string;
  hodName: string;
  hodDesignation: string;
  principalName: string;
  logoUrl: string;
}

export interface ReportStore {
  meta: ReportMeta;
  sections: ReportSection[];
  activeSectionId: string | null;
  setMeta: (meta: Partial<ReportMeta>) => void;
  addSection: (type: SectionType) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<ReportSection>) => void;
  reorderSections: (from: number, to: number) => void;
  setActiveSection: (id: string) => void;
}
