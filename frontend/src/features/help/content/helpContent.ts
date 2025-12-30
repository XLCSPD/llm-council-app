import {
  Rocket,
  Settings,
  Brain,
  Users,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface HelpContentBlock {
  type: 'heading' | 'paragraph' | 'list' | 'tip' | 'warning' | 'numbered-list';
  content: string | string[];
}

export interface HelpSection {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  content: HelpContentBlock[];
}

export const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    description: 'Learn the basics of LLM Council',
    content: [
      {
        type: 'heading',
        content: 'Welcome to LLM Council',
      },
      {
        type: 'paragraph',
        content:
          'LLM Council is a multi-agent AI deliberation platform that assembles configurable councils of AI models to provide independent reasoning, peer critique, and synthesized outcomes. The core principle is that better decisions come from structured disagreement, not single answers.',
      },
      {
        type: 'tip',
        content:
          'New here? Take the guided tour to learn the basics! Click "Start Tour" in the sidebar.',
      },
      {
        type: 'heading',
        content: 'How It Works',
      },
      {
        type: 'paragraph',
        content:
          'Each deliberation goes through four phases, with AI models working together to analyze your question from multiple perspectives:',
      },
      {
        type: 'numbered-list',
        content: [
          'Setup - Configure your prompt and select council members with different roles',
          'Reasoning - Each model generates an independent response to your question',
          'Review - Models critique and score each other\'s responses',
          'Synthesis - A chairman model synthesizes the final answer with confidence levels',
        ],
      },
      {
        type: 'heading',
        content: 'Your First Deliberation',
      },
      {
        type: 'numbered-list',
        content: [
          'Click "New Session" in the sidebar to start fresh',
          'Enter your question or topic in the prompt field',
          'Add at least 2 AI models to your council using the "Add Model" button',
          'Optionally assign roles to each model (Thinker, Critic, Devil\'s Advocate)',
          'Click "Start Deliberation" and watch the council work!',
        ],
      },
      {
        type: 'tip',
        content:
          'For best results, include models from different providers (e.g., Claude + GPT) to get diverse perspectives.',
      },
    ],
  },
  {
    id: 'setup',
    title: 'Setup Phase',
    icon: Settings,
    description: 'Configure prompts and council members',
    content: [
      {
        type: 'heading',
        content: 'Creating Your Prompt',
      },
      {
        type: 'paragraph',
        content:
          'The Setup phase is where you define what you want the council to deliberate on. You can write a freeform question or use templates for common scenarios.',
      },
      {
        type: 'heading',
        content: 'Prompt Fields',
      },
      {
        type: 'list',
        content: [
          'Question/Task - The main topic for deliberation (required)',
          'Objective - What outcome you\'re looking for (optional)',
          'Target Audience - Who the answer is for (optional)',
          'Context - Background information to help the council (optional)',
          'Constraints - Limitations or requirements to consider (optional)',
        ],
      },
      {
        type: 'tip',
        content:
          'Use the "Enhance with AI" button to get suggestions for improving your prompt. This uses AI to make your question clearer and more specific.',
      },
      {
        type: 'heading',
        content: 'Building Your Council',
      },
      {
        type: 'paragraph',
        content:
          'Select AI models to form your council. Each model can be assigned a specific role that influences how it approaches the question:',
      },
      {
        type: 'list',
        content: [
          'Thinker - Generates primary reasoning and ideas (default role)',
          'Critic - Evaluates and questions assumptions',
          'Devil\'s Advocate - Presents opposing viewpoints and challenges',
          'Synthesizer - Focuses on integrating different perspectives',
        ],
      },
      {
        type: 'heading',
        content: 'Model Weights',
      },
      {
        type: 'paragraph',
        content:
          'Each model has a weight (0-1) that determines its influence in the final synthesis. Higher weights mean more influence. By default, all models have equal weight.',
      },
      {
        type: 'warning',
        content:
          'You need at least 2 models to start a deliberation. For richer discussions, consider using 3-5 models with different roles.',
      },
    ],
  },
  {
    id: 'reasoning',
    title: 'Reasoning Phase',
    icon: Brain,
    description: 'How models generate responses',
    content: [
      {
        type: 'heading',
        content: 'Independent Reasoning',
      },
      {
        type: 'paragraph',
        content:
          'In the Reasoning phase, each council member independently analyzes your question and generates a response. Models work in parallel for faster results.',
      },
      {
        type: 'heading',
        content: 'Status Indicators',
      },
      {
        type: 'list',
        content: [
          'Pending - Model is queued and waiting to start',
          'Running - Model is actively generating a response (spinner)',
          'Succeeded - Response completed successfully (checkmark)',
          'Failed - An error occurred during generation (X)',
        ],
      },
      {
        type: 'heading',
        content: 'Viewing Responses',
      },
      {
        type: 'paragraph',
        content:
          'Click on any model card to expand and read the full response. Each response is color-coded by role:',
      },
      {
        type: 'list',
        content: [
          'Thinker - Teal/Cyan accent',
          'Critic - Purple accent',
          'Devil\'s Advocate - Orange accent',
          'Synthesizer - Gold accent',
        ],
      },
      {
        type: 'tip',
        content:
          'Watch for diverse perspectives! Different models often approach the same question from unique angles.',
      },
    ],
  },
  {
    id: 'review',
    title: 'Review Phase',
    icon: Users,
    description: 'Peer review and evaluation',
    content: [
      {
        type: 'heading',
        content: 'Peer Review Process',
      },
      {
        type: 'paragraph',
        content:
          'In the Review phase, each model evaluates the responses from other council members. Models score each other on a 0-10 scale and can provide rationale for their scores.',
      },
      {
        type: 'heading',
        content: 'Rankings Matrix',
      },
      {
        type: 'paragraph',
        content:
          'The matrix view shows all peer review scores in a grid format:',
      },
      {
        type: 'list',
        content: [
          'Rows represent responses being reviewed',
          'Columns represent the reviewers',
          'Cells show the score (0-10) each reviewer gave',
          'Click any cell to see the detailed rationale',
        ],
      },
      {
        type: 'heading',
        content: 'Chart Visualizations',
      },
      {
        type: 'paragraph',
        content:
          'Switch to Chart view for visual analysis:',
      },
      {
        type: 'list',
        content: [
          'Average Scores - Bar chart showing mean score per response',
          'Score Distribution - Histogram of all scores',
          'Response Comparison - Radar chart comparing responses',
        ],
      },
      {
        type: 'tip',
        content:
          'High agreement among reviewers suggests a strong consensus. Large score variations may indicate the topic has multiple valid perspectives.',
      },
    ],
  },
  {
    id: 'synthesis',
    title: 'Synthesis Phase',
    icon: Sparkles,
    description: 'Final answer and confidence',
    content: [
      {
        type: 'heading',
        content: 'The Final Synthesis',
      },
      {
        type: 'paragraph',
        content:
          'In the Synthesis phase, the chairman model (synthesizer role) combines all reasoning and peer reviews into a coherent final answer. This includes key agreements, disagreements, and an overall confidence assessment.',
      },
      {
        type: 'heading',
        content: 'Synthesis Components',
      },
      {
        type: 'list',
        content: [
          'Summary - The main synthesized answer',
          'Key Agreements - Points where council members agreed',
          'Key Disagreements - Areas of differing opinions',
          'Minority Opinions - Important dissenting viewpoints',
          'Recommendations - Suggested next steps or actions',
        ],
      },
      {
        type: 'heading',
        content: 'Confidence Level',
      },
      {
        type: 'paragraph',
        content:
          'The confidence indicator shows how certain the council is about the synthesis:',
      },
      {
        type: 'list',
        content: [
          'High (80-100%) - Strong consensus with solid reasoning',
          'Medium (50-79%) - General agreement with some uncertainty',
          'Low (0-49%) - Significant disagreement or uncertainty',
        ],
      },
      {
        type: 'heading',
        content: 'Exporting Results',
      },
      {
        type: 'list',
        content: [
          'Copy - Copy the synthesis text to clipboard',
          'Export - Download as a markdown file',
          'PDF Report - Generate a comprehensive PDF with all phases',
        ],
      },
      {
        type: 'tip',
        content:
          'The PDF report includes everything: your prompt, all reasoning responses, peer reviews, and the final synthesis. Great for documentation or sharing!',
      },
    ],
  },
];
