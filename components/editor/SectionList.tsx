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
      className={`group flex items-center gap-1 px-2 py-2 rounded-lg cursor-pointer text-sm transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className={`cursor-grab p-1 rounded ${isActive ? 'text-blue-200 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </span>
      <span className="flex-1 truncate font-medium">{section.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeSection(section.id);
        }}
        className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
          isActive ? 'hover:bg-blue-700 text-blue-100 hover:text-white' : 'hover:bg-red-100 text-gray-400 hover:text-red-600'
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
