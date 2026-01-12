const summaryPrompt = (context) => `
You are an academic summarization assistant.

The following content is extracted from multiple study materials related to the same subject unit.
The paragraphs may come from different files and random sections, but all belong to the same topic.

Task:
- Generate a clear, coherent summary of approximately 150 words.
- Combine overlapping ideas instead of listing them.
- Ignore repetition and unnecessary examples.
- Maintain a neutral, textbook-style tone.
- Do not mention PDFs, files, or paragraph sources.
- Do not add information that is not present in the content.

Content:
<<<
${context}
>>>
`;

export default summaryPrompt;
