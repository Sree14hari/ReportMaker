'use client';
// components/editor/SectionList.tsx
import { useReportStore } from '@/lib/store';
import { ReportSection } from '@/lib/reportTypes';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical } from 'lucide-react';

function SectionItem({ section, isActive }: { section: ReportSection; isActive: boolean }) {
  const setActiveSection = useReportStore((s) => s.setActiveSection);
  const removeSection = useReportStore((s) => s.removeSection);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setActiveSection(section.id)}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-200 border ${
        isActive
          ? 'bg-blue-50/80 border-blue-200 text-blue-900 shadow-[0_2px_10px_-4px_rgba(59,130,246,0.3)]'
          : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200'
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className={`cursor-grab p-1 rounded-md transition-colors ${
          isActive ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-100/50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-200/50'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </span>
      <span className={`flex-1 truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
        {section.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeSection(section.id);
        }}
        className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
          isActive 
            ? 'text-blue-400 hover:text-red-500 hover:bg-red-50' 
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        }`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function SectionList() {
  const sections = useReportStore((s) => s.sections);
  const activeSectionId = useReportStore((s) => s.activeSectionId);
  const reorderSections = useReportStore((s) => s.reorderSections);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    reorderSections(oldIndex, newIndex);
  }

  if (sections.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-400 text-xs text-center">
        No sections yet.<br />Add one above to begin.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              isActive={section.id === activeSectionId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
