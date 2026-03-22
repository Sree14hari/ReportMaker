'use client';
// lib/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { get, set as idbSet, del } from 'idb-keyval';
import { ReportStore, SectionType, ReportMeta, ReportSection } from './reportTypes';
import { sectionTemplates } from './sectionTemplates';

// Custom IndexedDB storage for Zustand to break localStorage's 5MB limit
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

const defaultMeta: ReportMeta = {
  title: '',
  headerContent: '',
  subtitle: 'Mini Project Report',
  studentNames: [{ name: '', rollNo: '' }],
  universityName: '',
  degree: 'Bachelor of Technology',
  branch: 'Electronics and Communication Engineering',
  collegeName: '',
  collegeShort: 'SBCE, Pattor',
  department: '',
  departmentShort: 'ECE',
  month: new Date().toLocaleString('default', { month: 'long' }),
  year: new Date().getFullYear().toString(),
  guideName: '',
  guideDesignation: 'Assistant Professor',
  hodName: '',
  hodDesignation: 'Professor and Head',
  principalName: 'Dr. K Krishna Kumar',
  projectCoordinatorName: '',
  projectCoordinatorDesignation: 'Assistant Professor',
  logoUrl: '',
};

function buildDefaultSections(): ReportSection[] {
  const sections: ReportSection[] = [
    {
      id: nanoid(),
      type: 'title-page',
      title: sectionTemplates['title-page'].defaultTitle,
      content: sectionTemplates['title-page'].defaultContent,
    },
    {
      id: nanoid(),
      type: 'declaration',
      title: sectionTemplates['declaration'].defaultTitle,
      content: sectionTemplates['declaration'].defaultContent,
    },
    {
      id: nanoid(),
      type: 'certificate',
      title: sectionTemplates['certificate'].defaultTitle,
      content: sectionTemplates['certificate'].defaultContent,
    },
    {
      id: nanoid(),
      type: 'acknowledgement',
      title: sectionTemplates['acknowledgement'].defaultTitle,
      content: sectionTemplates['acknowledgement'].defaultContent,
    },
    {
      id: nanoid(),
      type: 'abstract',
      title: sectionTemplates['abstract'].defaultTitle,
      content: sectionTemplates['abstract'].defaultContent,
    },
    {
      id: nanoid(),
      type: 'table-of-contents',
      title: sectionTemplates['table-of-contents'].defaultTitle,
      content: sectionTemplates['table-of-contents'].defaultContent,
    },
    {
      id: nanoid(),
      type: 'list-of-figures',
      title: sectionTemplates['list-of-figures'].defaultTitle,
      content: sectionTemplates['list-of-figures'].defaultContent,
    },
    {
      id: nanoid(),
      type: 'list-of-tables',
      title: sectionTemplates['list-of-tables'].defaultTitle,
      content: sectionTemplates['list-of-tables'].defaultContent,
    },
    {
      id: nanoid(),
      type: 'chapter',
      title: 'Chapter 1',
      content: sectionTemplates['chapter'].defaultContent,
      chapterNumber: 1,
    },
  ];

  return sections;
}

const defaultSections = buildDefaultSections();

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      meta: defaultMeta,
      sections: defaultSections,
      activeSectionId: defaultSections[0].id,
      isActivated: false,
      setActivated: (val) => set({ isActivated: val }),

      setMeta: (updates) =>
        set((state) => ({ meta: { ...state.meta, ...updates } })),

      addSection: (type: SectionType) => {
        const chapterCount = get().sections.filter((s) => s.type === 'chapter').length;
        const template = sectionTemplates[type];
        const newSection = {
          id: nanoid(),
          type,
          title: type === 'chapter' ? `Chapter ${chapterCount + 1}` : template.defaultTitle,
          content: template.defaultContent,
          chapterNumber: type === 'chapter' ? chapterCount + 1 : undefined,
        };
        set((state) => ({
          sections: [...state.sections, newSection],
          activeSectionId: newSection.id,
        }));
      },

      removeSection: (id) =>
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== id),
          activeSectionId:
            state.activeSectionId === id
              ? state.sections.filter((s) => s.id !== id)[0]?.id ?? null
              : state.activeSectionId,
        })),

      updateSection: (id, updates) =>
        set((state) => ({
          sections: state.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      reorderSections: (from, to) =>
        set((state) => {
          const sections = [...state.sections];
          const [moved] = sections.splice(from, 1);
          sections.splice(to, 0, moved);
          return { sections };
        }),

      setActiveSection: (id) => set({ activeSectionId: id }),

      loadProject: (project) =>
        set({
          meta: project.meta,
          sections: project.sections,
          activeSectionId: project.sections[0]?.id || null,
        }),
    }),
    { 
      name: 'report-store',
      storage: createJSONStorage(() => idbStorage)
    }
  )
);
