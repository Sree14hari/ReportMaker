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
  titlePageGap?: number;
  guideName: string;
  guideDesignation: string;
  hodName: string;
  hodDesignation: string;
  principalName: string;
  projectCoordinatorName?: string;
  projectCoordinatorDesignation?: string;
  logoUrl: string;
}

export interface ReportStore {
  meta: ReportMeta;
  sections: ReportSection[];
  activeSectionId: string | null;
  isActivated: boolean;
  setActivated: (val: boolean) => void;
  setMeta: (meta: Partial<ReportMeta>) => void;
  addSection: (type: SectionType) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<ReportSection>) => void;
  reorderSections: (from: number, to: number) => void;
  setActiveSection: (id: string) => void;
  loadProject: (project: Pick<ReportStore, 'meta' | 'sections'>) => void;
}
