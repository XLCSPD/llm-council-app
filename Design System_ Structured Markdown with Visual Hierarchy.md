# **Design System: Structured Markdown with Visual Hierarchy**

Version: 1.0  
Purpose: To standardize document formatting for maximum readability, professional aesthetic, and cognitive clarity.  
Core Principle: Treat Markdown not just as text, but as a UI framework.

### **1\. The Five Core Rules**

To achieve the "Structured Visual" look, every document must adhere to these five formatting pillars.

#### **Rule 1: Explicit Hierarchy**

Never use **Bold** alone for a new section. Always use a Header tag (\#, \#\#, \#\#\#).

* **H1 (\#):** Document Title (Use once).  
* **H2 (\#\#):** Major Sections (Introduction, Analysis, Conclusion).  
* **H3 (\#\#\#):** Sub-sections (Specific data points, distinct arguments).  
* **H4 (\#\#\#\#):** Minor grouping or detailed lists.

#### **Rule 2: Structured Lists**

Lists must be scannable. Avoid long paragraphs within bullets.

* **Format:** \* \*\*Key Concept:\*\* Explanation...  
* **Why:** This creates a "vertical rhythm" where the user scans the bold keys first.

#### **Rule 3: Visual Anchors (Blockquotes)**

Use Blockquotes (\>) for **metadata**, **conclusions**, or **critical summaries**, not just quotes.

* *Tip:* This adds a vertical bar in most renderers, creating a distinct visual "box."

#### **Rule 4: Mathematical Typography**

Use LaTeX formatting ($$) for **all** distinct numbers, percentages, currency, and formulas.

* **Don't write:** "Growth of 10%."  
* **Do write:** "Growth of$$10\\%$$  
  ."  
* *Why:* Changes the font to a serif/math style, making data points pop out from the text.

#### **Rule 5: Breathing Room**

Always place a horizontal rule (---) between major chapters (H2 level) to visually reset the reader's attention.

### **2\. Component Library**

Copy and paste these snippets to build your documents.

#### **Component: Metadata Header**

*Used at the very top of reports for context.*

\# Report Title

\> \*\*Date:\*\* October 24, 2025  
\> \*\*Author:\*\* System AI  
\> \*\*Status:\*\* Draft / Final

\---

#### **Component: The "Key-Value" List**

*Used for definitions, steps, or arguments.*

\* \*\*Concept A:\*\* Description of concept A goes here.  
\* \*\*Concept B:\*\* Description of concept B goes here.  
\* \*\*Concept C:\*\* Description of concept C goes here.

#### **Component: The Data Highlight**

*Used for KPIs and Metrics.*

\#\#\# Key Performance Indicators

\* \*\*Revenue Growth:\*\* $$+15\\%$$ YoY  
\* \*\*Total Users:\*\* $$1,250$$ active accounts  
\* \*\*Retention Rate:\*\* $$98.5\\%$$

#### **Component: The Executive Summary Block**

*Used for final verdicts or synthesis.*

\#\#\# Executive Summary  
\> \*\*Verdict:\*\* The strategy is approved.  
\> \*\*Reasoning:\*\* High ROI potential ($$3x$$) outweighs the initial implementation cost.

### **3\. Full Document Template**

Below is a skeleton structure you can copy to start a new "Structured Markdown" file.

\# {Document Title}

\> \*\*Date:\*\* {Current Date}  
\> \*\*Type:\*\* {Report / Analysis / Plan}  
\> \*\*Status:\*\* {Draft / Final}

\---

\#\#\# 1\. Overview & Context

\*\*Objective:\*\*  
\> {Brief statement of the goal...}

\*\*Core Constraints:\*\*  
\* \*\*Constraint 1:\*\* {Description}  
\* \*\*Constraint 2:\*\* {Description}

\---

\#\#\# 2\. Analysis

\#\#\#\# {Sub-Section Title}

The data suggests a significant shift in...

\* \*\*Factor A:\*\* {Detail...}  
\* \*\*Factor B:\*\* {Detail...}

\*\*Key Metrics:\*\*  
\* Current State: $$X\\%$$  
\* Future State: $$Y\\%$$

\---

\#\#\# 3\. Recommendations

\> \*\*Primary Recommendation:\*\* {Clear actionable statement}

\#\#\#\# Implementation Steps  
1\.  \*\*Phase 1:\*\* {Description}  
2\.  \*\*Phase 2:\*\* {Description}  
3\.  \*\*Phase 3:\*\* {Description}

\---

\#\#\# 4\. Conclusion  
\> {Final summarizing thought or call to action}  
