import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';

// Import editor fixes
import '../editor/editor-fixes.css';

const SimpleEditor = ({ defaultContent = '', label, onChange }) => {
    const extensions = [
        StarterKit.configure(),
        Typography,
        Highlight,
        TaskList,
        TaskItem.configure({
            nested: true,
        }),
    ];
    const content = JSON.parse(defaultContent);

    const editor = useEditor({
        extensions,
        content,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-a:text-blue-500 focus:outline-none min-h-48 p-3 rounded-lg border-2 border-default-200 hover:border-default-300 max-w-full',
            },
        },
        onBlur: ({ editor }) => {
            const newContent = editor.getJSON();
            if (onChange) {
                return onChange(newContent);
            }
        },
    });

    return (
        <div>
            {label && (
                <span className="block text-small font-medium text-foreground pb-1.5">{label}</span>
            )}
            <EditorContent editor={editor} />
        </div>
    );
};

export default SimpleEditor;
