'use client';
// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ReportStore, SectionType, ReportMeta } from './reportTypes';
import { sectionTemplates } from './sectionTemplates';

const defaultMeta: ReportMeta = {
  title: '',
  subtitle: 'Mini Project Report',
  studentNames: [{ name: '', rollNo: '' }],
  universityName: 'APJ Abdul Kalam Technological University',
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
  logoUrl: '',
};

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      meta: defaultMeta,
      sections: [],
      activeSectionId: null,

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
    }),
    { name: 'report-store' }
  )
);
