import { useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

import DragHandle from '@tiptap-pro/extension-drag-handle-react';
import { RiDraggable } from 'react-icons/ri';

// Import components
import TextMenu from './menus/TextMenu';
import LinkMenu from './menus/LinkMenu';

// Add styles for placeholder
import './editor.css';

const BlockEditor = ({
    defaultContent = '',
    label,
    onChange,
    placeholder = 'Start typing...',
    isEditable = true,
}) => {
    const menuContainerRef = useRef(null);

    // Parse default content or use empty document
    const content = defaultContent
        ? typeof defaultContent === 'string'
            ? JSON.parse(defaultContent)
            : defaultContent
        : '';

    // Configure extensions
    const extensions = [
        StarterKit.configure({
            heading: {
                levels: [1, 2, 3],
            },
        }),
        Typography,
        Highlight,
        TaskList,
        TaskItem.configure({
            nested: true,
        }),
        Placeholder.configure({
            placeholder,
        }),
        Link.configure({
            openOnClick: false,
        }),
        Image,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        Underline,
    ];

    // Initialize editor
    const editor = useEditor({
        extensions,
        content,
        editable: isEditable,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-a:text-blue-500 focus:outline-none min-h-[10vh] p-3 max-w-full',
            },
        },
        onBlur: ({ editor }) => {
            if (onChange) {
                onChange(editor.getJSON());
            }
        },
    });

    // Set focus to the end of the editor when it becomes editable
    useEffect(() => {
        if (editor && isEditable) {
            // Focus the editor and move cursor to the end
            editor.commands.focus('end');
        }
    }, [editor, isEditable]);

    if (!editor) {
        return null;
    }

    return (
        <div className="block-editor w-full" ref={menuContainerRef}>
            {label && (
                <span className="block text-small font-medium text-foreground pb-1.5">{label}</span>
            )}
            {isEditable && (
                <DragHandle editor={editor} tippyOptions={{}}>
                    <RiDraggable fontSize="1.2rem" />
                </DragHandle>
            )}
            <EditorContent editor={editor} />

            {/* Menus */}
            {isEditable && (
                <>
                    <LinkMenu editor={editor} appendTo={menuContainerRef} />
                    <TextMenu editor={editor} />
                </>
            )}
        </div>
    );
};

export default BlockEditor;
