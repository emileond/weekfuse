/**
 * Usage Example for plainTextToTiptap function
 * 
 * This file demonstrates how to use the plainTextToTiptap function
 * to convert plain text to Tiptap format.
 */

import { plainTextToTiptap } from './editorUtils.js';

/**
 * Example: Converting plain text to Tiptap format
 * 
 * @param {string} plainText - Plain text input
 * @returns {Object} - Content in Tiptap format
 */
function convertPlainTextExample(plainText) {
  // Convert the plain text to Tiptap format
  const tiptapContent = plainTextToTiptap(plainText);

  // Return the Tiptap content
  return tiptapContent;
}

// Example input
const exampleInput = `Plan for Completing Task 2

Review Requirements
Go through any available documentation or notes related to Task 2.
Identify any missing information needed to complete the task.
Set Objectives
Define clear goals for what needs to be achieved in Task 2.
Break down the task into smaller, manageable steps.
Assign Responsibilities
Determine if any team members need to be involved.
Assign specific roles and responsibilities if applicable.
Timeline and Milestones
Estimate the time required for each step.
Set deadlines for each milestone to ensure timely completion.
Resources Needed
Identify any tools, software, or resources required.
Ensure access to all necessary materials.
Execution
Begin working on the task according to the plan.
Monitor progress and adjust the plan as needed.
Review and Adjust
Regularly check progress against the objectives.
Make adjustments to the plan if obstacles arise.
Completion and Feedback
Once completed, review the task to ensure all objectives are met.
Gather feedback from stakeholders to identify areas for improvement.

This plan should help keep Task 2 on track and ensure a successful completion.`;

// Example usage in a React component:
/*
import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { plainTextToTiptap } from '../utils/editorUtils';

const TextEditor = ({ initialText }) => {
  // Convert plain text to Tiptap format
  const tiptapContent = plainTextToTiptap(initialText);

  // Initialize the editor with the Tiptap content
  const editor = useEditor({
    extensions: [StarterKit],
    content: tiptapContent,
  });

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TextEditor;
*/
