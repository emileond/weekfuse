import MarkdownIt from 'markdown-it';
/**
 * Utility functions for editor-related operations
 */

/**
 * Converts markdown text to Tiptap format
 *
 * This function parses markdown text and converts it to AST using markdown-it, then it converts it to Tiptap JSON format.
 * It supports the following markdown features:
 * - Headings (# Heading)
 * - Bold text (**bold** or __bold__)
 * - Italic text (*italic* or _italic_)
 * - Strikethrough text (~~strike~~)
 * - Code blocks (```code```)
 * - Inline code (`code`)
 * - Blockquotes (> quote)
 * - Bullet lists (- item or * item)
 * - Ordered lists (1. item)
 * - Links ([text](url))
 *
 * @param {string} markdown - Markdown text
 * @returns {Object} - Content in Tiptap format
 */
export const markdownToTipTap = (markdown) => {
    // If input is null or undefined, return empty document
    if (!markdown) {
        return {
            type: 'doc',
            content: [],
        };
    }

    const md = new MarkdownIt();
    const tokens = md.parse(markdown, {});

    // Create a new Tiptap document
    const tiptapDoc = {
        type: 'doc',
        content: [],
    };

    // Process tokens and convert to Tiptap format
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];

        // Process token based on its type
        switch (token.type) {
            case 'heading_open': {
                const headingLevel = parseInt(token.tag.slice(1));
                const headingContent = tokens[i + 1].content;
                tiptapDoc.content.push({
                    type: 'heading',
                    attrs: { level: headingLevel },
                    content: parseInlineContent(headingContent),
                });
                i += 3; // Skip the heading_content and heading_close tokens
                break;
            }

            case 'paragraph_open': {
                const paragraphContent = tokens[i + 1].content;
                if (paragraphContent.trim()) {
                    tiptapDoc.content.push({
                        type: 'paragraph',
                        content: parseInlineContent(paragraphContent),
                    });
                }
                i += 3; // Skip the paragraph_content and paragraph_close tokens
                break;
            }

            case 'bullet_list_open': {
                const bulletListContent = parseBulletList(tokens, i);
                tiptapDoc.content.push({
                    type: 'bulletList',
                    content: bulletListContent.items,
                });
                i = bulletListContent.endIndex + 1;
                break;
            }

            case 'ordered_list_open': {
                const orderedListContent = parseOrderedList(tokens, i);
                tiptapDoc.content.push({
                    type: 'orderedList',
                    content: orderedListContent.items,
                });
                i = orderedListContent.endIndex + 1;
                break;
            }

            case 'blockquote_open': {
                const blockquoteContent = parseBlockquote(tokens, i);
                tiptapDoc.content.push({
                    type: 'blockquote',
                    content: blockquoteContent.content,
                });
                i = blockquoteContent.endIndex + 1;
                break;
            }

            case 'code_block':
                tiptapDoc.content.push({
                    type: 'codeBlock',
                    attrs: { language: token.info || null },
                    content: [{ type: 'text', text: token.content }],
                });
                i++;
                break;

            case 'fence':
                tiptapDoc.content.push({
                    type: 'codeBlock',
                    attrs: { language: token.info || null },
                    content: [{ type: 'text', text: token.content }],
                });
                i++;
                break;

            case 'hr':
                tiptapDoc.content.push({ type: 'horizontalRule' });
                i++;
                break;

            default:
                i++;
                break;
        }
    }

    return tiptapDoc;
};

/**
 * Parses inline content (text with formatting) to Tiptap format
 *
 * @param {string} content - Text content with markdown formatting
 * @returns {Array} - Array of Tiptap inline nodes
 */
const parseInlineContent = (content) => {
    if (!content) return [];

    const result = [];
    let currentText = '';
    let currentMarks = [];

    // Simple regex-based parsing for inline formatting
    // This is a simplified approach and might not handle all edge cases

    // Process the content character by character
    for (let i = 0; i < content.length; i++) {
        // Check for bold (**text**)
        if (content.substring(i, i + 2) === '**' && content.indexOf('**', i + 2) !== -1) {
            // Add any accumulated text before the bold marker
            if (currentText) {
                result.push({
                    type: 'text',
                    text: currentText,
                    ...(currentMarks.length > 0 && { marks: [...currentMarks] }),
                });
                currentText = '';
            }

            // Find the closing bold marker
            const boldEnd = content.indexOf('**', i + 2);
            const boldText = content.substring(i + 2, boldEnd);

            // Add the bold text with appropriate mark
            result.push({
                type: 'text',
                text: boldText,
                marks: [...currentMarks, { type: 'bold' }],
            });

            // Skip to after the closing bold marker
            i = boldEnd + 1;
            continue;
        }

        // Check for italic (*text*)
        if (
            content.charAt(i) === '*' &&
            content.indexOf('*', i + 1) !== -1 &&
            content.substring(i, i + 2) !== '**'
        ) {
            // Add any accumulated text before the italic marker
            if (currentText) {
                result.push({
                    type: 'text',
                    text: currentText,
                    ...(currentMarks.length > 0 && { marks: [...currentMarks] }),
                });
                currentText = '';
            }

            // Find the closing italic marker
            const italicEnd = content.indexOf('*', i + 1);
            const italicText = content.substring(i + 1, italicEnd);

            // Add the italic text with appropriate mark
            result.push({
                type: 'text',
                text: italicText,
                marks: [...currentMarks, { type: 'italic' }],
            });

            // Skip to after the closing italic marker
            i = italicEnd;
            continue;
        }

        // Check for strikethrough (~~text~~)
        if (content.substring(i, i + 2) === '~~' && content.indexOf('~~', i + 2) !== -1) {
            // Add any accumulated text before the strikethrough marker
            if (currentText) {
                result.push({
                    type: 'text',
                    text: currentText,
                    ...(currentMarks.length > 0 && { marks: [...currentMarks] }),
                });
                currentText = '';
            }

            // Find the closing strikethrough marker
            const strikeEnd = content.indexOf('~~', i + 2);
            const strikeText = content.substring(i + 2, strikeEnd);

            // Add the strikethrough text with appropriate mark
            result.push({
                type: 'text',
                text: strikeText,
                marks: [...currentMarks, { type: 'strike' }],
            });

            // Skip to after the closing strikethrough marker
            i = strikeEnd + 1;
            continue;
        }

        // Check for inline code (`text`)
        if (content.charAt(i) === '`' && content.indexOf('`', i + 1) !== -1) {
            // Add any accumulated text before the code marker
            if (currentText) {
                result.push({
                    type: 'text',
                    text: currentText,
                    ...(currentMarks.length > 0 && { marks: [...currentMarks] }),
                });
                currentText = '';
            }

            // Find the closing code marker
            const codeEnd = content.indexOf('`', i + 1);
            const codeText = content.substring(i + 1, codeEnd);

            // Add the code text with appropriate mark
            result.push({
                type: 'text',
                text: codeText,
                marks: [...currentMarks, { type: 'code' }],
            });

            // Skip to after the closing code marker
            i = codeEnd;
            continue;
        }

        // Check for links ([text](url))
        if (
            content.charAt(i) === '[' &&
            content.indexOf('](', i) !== -1 &&
            content.indexOf(')', content.indexOf('](', i)) !== -1
        ) {
            // Add any accumulated text before the link marker
            if (currentText) {
                result.push({
                    type: 'text',
                    text: currentText,
                    ...(currentMarks.length > 0 && { marks: [...currentMarks] }),
                });
                currentText = '';
            }

            // Find the closing brackets and extract text and URL
            const textEnd = content.indexOf('](', i);
            const urlEnd = content.indexOf(')', textEnd);
            const linkText = content.substring(i + 1, textEnd);
            const linkUrl = content.substring(textEnd + 2, urlEnd);

            // Add the link text with appropriate mark
            result.push({
                type: 'text',
                text: linkText,
                marks: [...currentMarks, { type: 'link', attrs: { href: linkUrl } }],
            });

            // Skip to after the closing parenthesis
            i = urlEnd;
            continue;
        }

        // If no special formatting, accumulate the character
        currentText += content.charAt(i);
    }

    // Add any remaining text
    if (currentText) {
        result.push({
            type: 'text',
            text: currentText,
            ...(currentMarks.length > 0 && { marks: [...currentMarks] }),
        });
    }

    return result;
};

/**
 * Parses a bullet list from markdown-it tokens
 *
 * @param {Array} tokens - Array of markdown-it tokens
 * @param {number} startIndex - Starting index of the bullet list
 * @returns {Object} - Object containing list items and end index
 */
const parseBulletList = (tokens, startIndex) => {
    const items = [];
    let i = startIndex + 1; // Skip the bullet_list_open token

    while (i < tokens.length && tokens[i].type !== 'bullet_list_close') {
        if (tokens[i].type === 'list_item_open') {
            const itemContent = [];
            let j = i + 1; // Skip the list_item_open token

            while (j < tokens.length && tokens[j].type !== 'list_item_close') {
                if (tokens[j].type === 'paragraph_open') {
                    const paragraphContent = tokens[j + 1].content;
                    itemContent.push({
                        type: 'paragraph',
                        content: parseInlineContent(paragraphContent),
                    });
                    j += 3; // Skip paragraph_content and paragraph_close
                } else if (
                    tokens[j].type === 'bullet_list_open' ||
                    tokens[j].type === 'ordered_list_open'
                ) {
                    // Handle nested lists
                    const nestedList =
                        tokens[j].type === 'bullet_list_open'
                            ? parseBulletList(tokens, j)
                            : parseOrderedList(tokens, j);

                    itemContent.push({
                        type: tokens[j].type === 'bullet_list_open' ? 'bulletList' : 'orderedList',
                        content: nestedList.items,
                    });

                    j = nestedList.endIndex + 1;
                } else {
                    j++;
                }
            }

            items.push({
                type: 'listItem',
                content: itemContent,
            });

            i = j + 1; // Skip the list_item_close token
        } else {
            i++;
        }
    }

    return { items, endIndex: i };
};

/**
 * Parses an ordered list from markdown-it tokens
 *
 * @param {Array} tokens - Array of markdown-it tokens
 * @param {number} startIndex - Starting index of the ordered list
 * @returns {Object} - Object containing list items and end index
 */
const parseOrderedList = (tokens, startIndex) => {
    const items = [];
    let i = startIndex + 1; // Skip the ordered_list_open token

    while (i < tokens.length && tokens[i].type !== 'ordered_list_close') {
        if (tokens[i].type === 'list_item_open') {
            const itemContent = [];
            let j = i + 1; // Skip the list_item_open token

            while (j < tokens.length && tokens[j].type !== 'list_item_close') {
                if (tokens[j].type === 'paragraph_open') {
                    const paragraphContent = tokens[j + 1].content;
                    itemContent.push({
                        type: 'paragraph',
                        content: parseInlineContent(paragraphContent),
                    });
                    j += 3; // Skip paragraph_content and paragraph_close
                } else if (
                    tokens[j].type === 'bullet_list_open' ||
                    tokens[j].type === 'ordered_list_open'
                ) {
                    // Handle nested lists
                    const nestedList =
                        tokens[j].type === 'bullet_list_open'
                            ? parseBulletList(tokens, j)
                            : parseOrderedList(tokens, j);

                    itemContent.push({
                        type: tokens[j].type === 'bullet_list_open' ? 'bulletList' : 'orderedList',
                        content: nestedList.items,
                    });

                    j = nestedList.endIndex + 1;
                } else {
                    j++;
                }
            }

            items.push({
                type: 'listItem',
                content: itemContent,
            });

            i = j + 1; // Skip the list_item_close token
        } else {
            i++;
        }
    }

    return { items, endIndex: i };
};

/**
 * Parses a blockquote from markdown-it tokens
 *
 * @param {Array} tokens - Array of markdown-it tokens
 * @param {number} startIndex - Starting index of the blockquote
 * @returns {Object} - Object containing blockquote content and end index
 */
const parseBlockquote = (tokens, startIndex) => {
    const content = [];
    let i = startIndex + 1; // Skip the blockquote_open token

    while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
        if (tokens[i].type === 'paragraph_open') {
            const paragraphContent = tokens[i + 1].content;
            content.push({
                type: 'paragraph',
                content: parseInlineContent(paragraphContent),
            });
            i += 3; // Skip paragraph_content and paragraph_close
        } else {
            i++;
        }
    }

    return { content, endIndex: i };
};

/**
 * Converts a Jira Atlassian Document Format (ADF) object to a Tiptap-compatible JSON document.
 * This function assumes the input `jiraAdfContent` is already a JavaScript object
 * (not a string that needs parsing).
 *
 * @param {object | null | undefined} jiraAdfContent - The description object from Jira (ADF).
 * @returns {object} A Tiptap-compatible document object.
 */
export const convertJiraAdfToTiptap = (jiraAdfContent) => {
    // If input is null or undefined, return an empty Tiptap document
    if (!jiraAdfContent) {
        return {
            type: 'doc',
            content: [],
        };
    }

    // Create a new Tiptap document
    const tiptapDoc = {
        type: 'doc',
        content: [],
    };

    // If the content has no content array, return empty document
    if (!jiraAdfContent.content || !Array.isArray(jiraAdfContent.content)) {
        return tiptapDoc;
    }

    // Process each node in the content array and filter out null values
    tiptapDoc.content = jiraAdfContent.content
        .map((node) => convertJiraNode(node))
        .filter((node) => node !== null);

    return tiptapDoc;
};

/**
 * Converts a Jira ADF node to a Tiptap node
 *
 * @param {Object} node - Jira ADF node
 * @returns {Object|null} - Tiptap node or null if the node type should be skipped
 */
const convertJiraNode = (node) => {
    // Skip null or undefined nodes
    if (!node) return null;

    try {
        switch (node.type) {
            case 'paragraph':
                return convertJiraParagraph(node);
            case 'bulletList':
            case 'orderedList':
            case 'taskList':
                return convertJiraList(node);
            case 'listItem':
            case 'taskItem':
                return convertJiraListItem(node);
            case 'heading':
                return convertJiraHeading(node);
            case 'blockquote':
                return convertJiraBlockquote(node);
            case 'codeBlock':
                return convertJiraCodeBlock(node);
            case 'rule':
                return { type: 'horizontalRule' };
            case 'mediaSingle':
            case 'mediaGroup':
            case 'expand':
            case 'extension':
            case 'bodiedExtension':
            case 'table':
                // Skip these complex types that might cause errors
                return null;
            default:
                // For unknown node types, try to pass through if it has content
                if (node.content && Array.isArray(node.content)) {
                    return {
                        ...node,
                        content: node.content
                            .map((childNode) => convertJiraNode(childNode))
                            .filter((childNode) => childNode !== null),
                    };
                }
                // Otherwise return the node as is
                return node;
        }
    } catch (error) {
        // If any error occurs during conversion, skip this node
        console.error(`Error converting Jira node of type ${node.type}:`, error);
        return null;
    }
};

/**
 * Converts a Jira ADF paragraph to a Tiptap paragraph
 *
 * @param {Object} paragraph - Jira ADF paragraph node
 * @returns {Object} - Tiptap paragraph node
 */
const convertJiraParagraph = (paragraph) => {
    return {
        type: 'paragraph',
        content: paragraph.content
            ? paragraph.content
                  .map((node) => convertJiraInlineNode(node))
                  .filter((node) => node !== null)
            : [],
    };
};

/**
 * Converts a Jira ADF list to a Tiptap list
 *
 * @param {Object} list - Jira ADF list node
 * @returns {Object} - Tiptap list node
 */
const convertJiraList = (list) => {
    return {
        type: list.type,
        content: list.content
            ? list.content.map((node) => convertJiraNode(node)).filter((node) => node !== null)
            : [],
    };
};

/**
 * Converts a Jira ADF list item to a Tiptap list item
 *
 * @param {Object} listItem - Jira ADF list item node
 * @returns {Object} - Tiptap list item node
 */
const convertJiraListItem = (listItem) => {
    return {
        type: listItem.type,
        content: listItem.content
            ? listItem.content.map((node) => convertJiraNode(node)).filter((node) => node !== null)
            : [],
    };
};

/**
 * Converts a Jira ADF heading to a Tiptap heading
 *
 * @param {Object} heading - Jira ADF heading node
 * @returns {Object} - Tiptap heading node
 */
const convertJiraHeading = (heading) => {
    return {
        type: 'heading',
        attrs: heading.attrs || { level: 1 },
        content: heading.content
            ? heading.content
                  .map((node) => convertJiraInlineNode(node))
                  .filter((node) => node !== null)
            : [],
    };
};

/**
 * Converts a Jira ADF blockquote to a Tiptap blockquote
 *
 * @param {Object} blockquote - Jira ADF blockquote node
 * @returns {Object} - Tiptap blockquote node
 */
const convertJiraBlockquote = (blockquote) => {
    return {
        type: 'blockquote',
        content: blockquote.content
            ? blockquote.content
                  .map((node) => convertJiraNode(node))
                  .filter((node) => node !== null)
            : [],
    };
};

/**
 * Converts a Jira ADF codeBlock to a Tiptap codeBlock
 *
 * @param {Object} codeBlock - Jira ADF codeBlock node
 * @returns {Object} - Tiptap codeBlock node
 */
const convertJiraCodeBlock = (codeBlock) => {
    return {
        type: 'codeBlock',
        attrs: codeBlock.attrs || { language: null },
        content: codeBlock.content
            ? codeBlock.content
                  .map((node) => convertJiraInlineNode(node))
                  .filter((node) => node !== null)
            : [],
    };
};

/**
 * Converts a Jira ADF inline node to a Tiptap inline node
 *
 * @param {Object} node - Jira ADF inline node
 * @returns {Object|null} - Tiptap inline node or null if the node type should be skipped
 */
const convertJiraInlineNode = (node) => {
    if (!node) return null;

    try {
        switch (node.type) {
            case 'text':
                return convertJiraText(node);
            case 'mention':
                return convertJiraMention(node);
            case 'emoji':
                return convertJiraEmoji(node);
            case 'hardBreak':
                return { type: 'hardBreak' };
            case 'inlineCard':
            case 'media':
                // Skip these types that might cause errors
                return null;
            default:
                // For unknown inline node types, return as is
                return node;
        }
    } catch (error) {
        // If any error occurs during conversion, skip this node
        console.error(`Error converting Jira inline node of type ${node.type}:`, error);
        return null;
    }
};

/**
 * Converts a Jira ADF text node to a Tiptap text node
 *
 * @param {Object} textNode - Jira ADF text node
 * @returns {Object} - Tiptap text node
 */
const convertJiraText = (textNode) => {
    const tiptapTextNode = {
        type: 'text',
        text: textNode.text || '',
    };

    // Handle marks (bold, italic, etc.)
    if (textNode.marks && Array.isArray(textNode.marks)) {
        tiptapTextNode.marks = textNode.marks;
    }

    return tiptapTextNode;
};

/**
 * Converts a Jira ADF mention node to a Tiptap mention node
 *
 * @param {Object} mentionNode - Jira ADF mention node
 * @returns {Object} - Tiptap mention node
 */
const convertJiraMention = (mentionNode) => {
    if (!mentionNode.attrs) return null;

    return {
        type: 'mention',
        attrs: {
            id: mentionNode.attrs.id || '',
            label: mentionNode.attrs.text || mentionNode.attrs.displayName || '',
            // Map other attributes as needed
            ...mentionNode.attrs,
        },
    };
};

/**
 * Converts a Jira ADF emoji node to a Tiptap text node with the emoji
 *
 * @param {Object} emojiNode - Jira ADF emoji node
 * @returns {Object} - Tiptap text node with emoji
 */
const convertJiraEmoji = (emojiNode) => {
    if (!emojiNode.attrs || !emojiNode.attrs.shortName) return null;

    // Convert emoji shortName to actual emoji if possible, or just use the shortName
    return {
        type: 'text',
        text: emojiNode.attrs.shortName,
    };
};
