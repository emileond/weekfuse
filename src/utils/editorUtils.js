/**
 * Utility functions for editor-related operations
 */

/**
 * Converts markdown text to Tiptap format
 * 
 * @param {string} markdown - Markdown text
 * @returns {Object} - Content in Tiptap format
 */
export const markdownToTipTap = (markdown) => {
  // If input is null or undefined, return empty document
  if (!markdown) {
    return {
      type: 'doc',
      content: []
    };
  }

  // Create a new Tiptap document
  const tiptapDoc = {
    type: 'doc',
    content: []
  };

  // Split the markdown into lines
  const lines = markdown.split('\n');

  // Process the lines
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Check for headings (# Heading)
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)[0].length;
      if (level <= 6) {
        const headingText = line.substring(level).trim();
        tiptapDoc.content.push({
          type: 'heading',
          attrs: { level },
          content: [{ type: 'text', text: headingText }]
        });
        i++;
        continue;
      }
    }

    // Check for bullet lists (- item or * item)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems = [];

      // Collect all consecutive list items
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const itemText = lines[i].trim().substring(2);
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: itemText }]
          }]
        });
        i++;
      }

      tiptapDoc.content.push({
        type: 'bulletList',
        content: listItems
      });

      continue;
    }

    // Check for numbered lists (1. item)
    if (/^\d+\.\s/.test(line)) {
      const listItems = [];

      // Collect all consecutive list items
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s/, '');
        listItems.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: itemText }]
          }]
        });
        i++;
      }

      tiptapDoc.content.push({
        type: 'orderedList',
        content: listItems
      });

      continue;
    }

    // Check for code blocks (```code```)
    if (line.startsWith('```')) {
      const language = line.substring(3).trim();
      const codeLines = [];
      i++;

      // Collect all lines until the closing ```
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      // Skip the closing ```
      if (i < lines.length) {
        i++;
      }

      tiptapDoc.content.push({
        type: 'codeBlock',
        attrs: { language: language || null },
        content: [{ type: 'text', text: codeLines.join('\n') }]
      });

      continue;
    }

    // Check for blockquotes (> quote)
    if (line.startsWith('> ')) {
      const quoteLines = [];

      // Collect all consecutive blockquote lines
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().substring(2));
        i++;
      }

      tiptapDoc.content.push({
        type: 'blockquote',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: quoteLines.join('\n') }]
        }]
      });

      continue;
    }

    // Default: treat as paragraph
    // Process inline formatting (bold, italic, etc.)
    tiptapDoc.content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: line }]
    });

    i++;
  }

  return tiptapDoc;
};

/**
 * Converts TinyMCE content format to Tiptap format
 * 
 * @param {Object} tinymceContent - Content in TinyMCE format
 * @returns {Object} - Content in Tiptap format
 */
export const tinymceToTiptap = (tinymceContent) => {
  // If input is null or undefined, return empty document
  if (!tinymceContent) {
    return {
      type: 'doc',
      content: []
    };
  }

  // If input is a string, try to parse it as JSON
  const content = typeof tinymceContent === 'string' 
    ? JSON.parse(tinymceContent) 
    : tinymceContent;

  // Create a new Tiptap document
  const tiptapDoc = {
    type: 'doc',
    content: []
  };

  // If the content has no content array, return empty document
  if (!content.content || !Array.isArray(content.content)) {
    return tiptapDoc;
  }

  // Process each node in the content array
  tiptapDoc.content = content.content.map(node => convertNode(node));

  return tiptapDoc;
};

/**
 * Converts a TinyMCE node to a Tiptap node
 * 
 * @param {Object} node - TinyMCE node
 * @returns {Object} - Tiptap node
 */
const convertNode = (node) => {
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node);
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
      return convertList(node);
    case 'listItem':
    case 'taskItem':
      return convertListItem(node);
    case 'heading':
      return convertHeading(node);
    case 'blockquote':
      return convertBlockquote(node);
    case 'codeBlock':
      return convertCodeBlock(node);
    case 'image':
      return convertImage(node);
    default:
      // For unknown node types, try to pass through if it has content
      if (node.content && Array.isArray(node.content)) {
        return {
          ...node,
          content: node.content.map(childNode => convertNode(childNode))
        };
      }
      // Otherwise return the node as is
      return node;
  }
};

/**
 * Converts a TinyMCE paragraph to a Tiptap paragraph
 * 
 * @param {Object} paragraph - TinyMCE paragraph node
 * @returns {Object} - Tiptap paragraph node
 */
const convertParagraph = (paragraph) => {
  return {
    type: 'paragraph',
    content: paragraph.content ? paragraph.content.map(node => convertInlineNode(node)) : []
  };
};

/**
 * Converts a TinyMCE list to a Tiptap list
 * 
 * @param {Object} list - TinyMCE list node
 * @returns {Object} - Tiptap list node
 */
const convertList = (list) => {
  return {
    type: list.type,
    content: list.content ? list.content.map(node => convertNode(node)) : []
  };
};

/**
 * Converts a TinyMCE list item to a Tiptap list item
 * 
 * @param {Object} listItem - TinyMCE list item node
 * @returns {Object} - Tiptap list item node
 */
const convertListItem = (listItem) => {
  return {
    type: listItem.type,
    content: listItem.content ? listItem.content.map(node => convertNode(node)) : []
  };
};

/**
 * Converts a TinyMCE heading to a Tiptap heading
 * 
 * @param {Object} heading - TinyMCE heading node
 * @returns {Object} - Tiptap heading node
 */
const convertHeading = (heading) => {
  return {
    type: 'heading',
    attrs: heading.attrs || { level: 1 },
    content: heading.content ? heading.content.map(node => convertInlineNode(node)) : []
  };
};

/**
 * Converts a TinyMCE blockquote to a Tiptap blockquote
 * 
 * @param {Object} blockquote - TinyMCE blockquote node
 * @returns {Object} - Tiptap blockquote node
 */
const convertBlockquote = (blockquote) => {
  return {
    type: 'blockquote',
    content: blockquote.content ? blockquote.content.map(node => convertNode(node)) : []
  };
};

/**
 * Converts a TinyMCE codeBlock to a Tiptap codeBlock
 * 
 * @param {Object} codeBlock - TinyMCE codeBlock node
 * @returns {Object} - Tiptap codeBlock node
 */
const convertCodeBlock = (codeBlock) => {
  return {
    type: 'codeBlock',
    attrs: codeBlock.attrs || { language: null },
    content: codeBlock.content ? codeBlock.content.map(node => convertInlineNode(node)) : []
  };
};

/**
 * Converts a TinyMCE image to a Tiptap image
 * 
 * @param {Object} image - TinyMCE image node
 * @returns {Object} - Tiptap image node
 */
const convertImage = (image) => {
  return {
    type: 'image',
    attrs: image.attrs || { src: '', alt: '' }
  };
};

/**
 * Converts a TinyMCE inline node to a Tiptap inline node
 * 
 * @param {Object} node - TinyMCE inline node
 * @returns {Object} - Tiptap inline node
 */
const convertInlineNode = (node) => {
  switch (node.type) {
    case 'text':
      return convertText(node);
    case 'mention':
      return convertMention(node);
    case 'hardBreak':
      return { type: 'hardBreak' };
    default:
      // For unknown inline node types, return as is
      return node;
  }
};

/**
 * Converts a TinyMCE text node to a Tiptap text node
 * 
 * @param {Object} textNode - TinyMCE text node
 * @returns {Object} - Tiptap text node
 */
const convertText = (textNode) => {
  const tiptapTextNode = {
    type: 'text',
    text: textNode.text || ''
  };

  // Handle marks (bold, italic, etc.)
  if (textNode.marks && Array.isArray(textNode.marks)) {
    tiptapTextNode.marks = textNode.marks;
  }

  return tiptapTextNode;
};

/**
 * Converts a TinyMCE mention node to a Tiptap mention node
 * 
 * @param {Object} mentionNode - TinyMCE mention node
 * @returns {Object} - Tiptap mention node
 */
const convertMention = (mentionNode) => {
  return {
    type: 'mention',
    attrs: {
      id: mentionNode.attrs?.id || '',
      label: mentionNode.attrs?.text || '',
      // Map other attributes as needed
      ...mentionNode.attrs
    }
  };
};

/**
 * Converts plain text to Tiptap format, detecting structure based on text patterns
 * 
 * @param {string} plainText - Plain text input
 * @returns {Object} - Content in Tiptap format
 */
export const plainTextToTiptap = (plainText) => {
  // If input is null or undefined, return empty document
  if (!plainText) {
    return {
      type: 'doc',
      content: []
    };
  }

  // Create a new Tiptap document
  const tiptapDoc = {
    type: 'doc',
    content: []
  };

  // Split the text into lines
  const lines = plainText.split('\n');

  // Process the lines
  let i = 0;
  let inList = false;
  let listItems = [];
  let currentSection = null;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Handle empty lines
    if (!trimmedLine) {
      // If we were in a list, add the list to the document
      if (inList) {
        tiptapDoc.content.push({
          type: 'bulletList',
          content: listItems
        });
        inList = false;
        listItems = [];
      }

      // Add an empty paragraph for spacing
      tiptapDoc.content.push({
        type: 'paragraph',
        content: []
      });

      i++;
      continue;
    }

    // Check if this is the first line (title)
    if (i === 0) {
      tiptapDoc.content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: trimmedLine }]
      });

      i++;
      continue;
    }

    // Check for section headings
    // A section heading is typically short (1-4 words) and followed by content
    const wordCount = trimmedLine.split(/\s+/).length;
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    const isLastLine = i === lines.length - 1;

    // Detect if this line is a section heading
    const isSectionHeading = wordCount <= 4 && 
                            !isLastLine && 
                            nextLine && 
                            !nextLine.startsWith('#') && 
                            !nextLine.startsWith('-') && 
                            !nextLine.startsWith('*');

    if (isSectionHeading) {
      // If we were in a list, add the list to the document
      if (inList) {
        tiptapDoc.content.push({
          type: 'bulletList',
          content: listItems
        });
        inList = false;
        listItems = [];
      }

      // Add the section heading
      tiptapDoc.content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: trimmedLine }]
      });

      currentSection = trimmedLine;
      i++;
      continue;
    }

    // Check if this line is part of a list
    // Lines after a section heading or indented lines are treated as list items
    const isIndented = line.startsWith(' ') || line.startsWith('\t');
    const isPrevLineHeading = currentSection !== null && i > 0 && lines[i - 1].trim() === currentSection;

    if (isPrevLineHeading || isIndented || inList) {
      inList = true;

      listItems.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: trimmedLine }]
        }]
      });

      i++;
      continue;
    }

    // Default: treat as paragraph
    tiptapDoc.content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: trimmedLine }]
    });

    i++;
  }

  // If we ended while still in a list, add the list to the document
  if (inList) {
    tiptapDoc.content.push({
      type: 'bulletList',
      content: listItems
    });
  }

  return tiptapDoc;
};
