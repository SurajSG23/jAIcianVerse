const mcqPrompt = (summary) => `

You are an MCQ generator.

Given a unit summary, generate EXACTLY 10 MCQs.

Rules:
- Output MUST be valid JSON only.
- No markdown, no explanations outside JSON.
- Each question must have:
  - "question" (string)
  - "options" (array of exactly 4 strings)
  - "answer" (must exactly match one option)
  - "explanation" (short string)
- Medium difficulty.
- No numbering or option labels.

JSON FORMAT:

{
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "answer": "",
      "explanation": ""
    }
  ]
}
  
Summary:
<<<
${summary}
>>>
`;

export default mcqPrompt;
