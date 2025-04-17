/**
 * Test script for editorUtils.js
 * This file is for testing purposes only and should not be included in production.
 */

import { tinymceToTiptap } from './editorUtils.js';

// Example TinyMCE content from the issue description
const tinymceExample = {
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "text": "Creating a placeholder. ",
          "type": "text"
        },
        {
          "type": "mention",
          "attrs": {
            "id": "63910ff18fd2d2d5f132620c",
            "text": "@Eric Poon",
            "localId": "e3c769b1-87ae-4c13-9085-b5c29f1c5945",
            "accessLevel": ""
          }
        },
        {
          "text": " and ",
          "type": "text"
        },
        {
          "type": "mention",
          "attrs": {
            "id": "712020:d84560ee-3628-4329-9515-25f93e81c431",
            "text": "@Salim Mohammed",
            "localId": "fa35638f-07ef-43bd-88a7-84c8c6d99c72",
            "accessLevel": ""
          }
        },
        {
          "text": " will discuss with ",
          "type": "text"
        },
        {
          "type": "mention",
          "attrs": {
            "id": "5f5fd7202d51d4006aa5a1b9",
            "text": "@Emilio Sanchez",
            "localId": "91934e37-989e-4180-ab52-e25755daad73",
            "accessLevel": ""
          }
        },
        {
          "text": ".",
          "type": "text"
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "text": "Putting as 5 points for now.",
          "type": "text"
        }
      ]
    }
  ],
  "version": 1
};

// Example Tiptap content from the issue description
const tiptapExample = {
  "type": "doc",
  "content": [
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Bottom to top vs top to bottom "
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "\"…\" button"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Test the conversion function
const convertedContent = tinymceToTiptap(tinymceExample);
console.log('Converted TinyMCE to Tiptap:');
console.log(JSON.stringify(convertedContent, null, 2));

// Compare with expected Tiptap format
console.log('\nExpected Tiptap format (different content but similar structure):');
console.log(JSON.stringify(tiptapExample, null, 2));

// Test with null input
console.log('\nTest with null input:');
console.log(JSON.stringify(tinymceToTiptap(null), null, 2));

// Test with string input
console.log('\nTest with string input:');
console.log(JSON.stringify(tinymceToTiptap(JSON.stringify(tinymceExample)), null, 2));

// Test with a more complex example including lists
const complexExample = {
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "text": "Here's a paragraph with ",
          "type": "text"
        },
        {
          "text": "bold",
          "type": "text",
          "marks": [{ "type": "bold" }]
        },
        {
          "text": " and ",
          "type": "text"
        },
        {
          "text": "italic",
          "type": "text",
          "marks": [{ "type": "italic" }]
        },
        {
          "text": " text.",
          "type": "text"
        }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "text": "List item 1",
                  "type": "text"
                }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "text": "List item 2",
                  "type": "text"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "version": 1
};

console.log('\nTest with complex example:');
console.log(JSON.stringify(tinymceToTiptap(complexExample), null, 2));