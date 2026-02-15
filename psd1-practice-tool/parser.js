const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');

function parseQuestions() {
    try {
        const content = fs.readFileSync(readmePath, 'utf8');
        const lines = content.split('\n');
        const questions = [];
        let currentQuestion = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('### ')) {
                // If we were processing a question, save it (unless it was just empty)
                if (currentQuestion) {
                    // Check if it has options, otherwise it might be a header we don't want or incomplete
                    if (currentQuestion.options.length > 0) {
                        // Extract images from question text
                        extractImages(currentQuestion);
                        questions.push(currentQuestion);
                    }
                }

                // Start a new question
                currentQuestion = {
                    id: questions.length + 1,
                    question: line.replace('### ', '').trim(),
                    options: [],
                    expectedAnswers: 0,
                    images: []
                };
            } else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
                if (currentQuestion) {
                    const isCorrect = line.startsWith('- [x]');
                    const text = line.replace(/- \[[ x]\] /, '').trim();
                    currentQuestion.options.push({ text, isCorrect });
                    if (isCorrect) {
                        currentQuestion.expectedAnswers++;
                    }
                }
            } else if (line.includes('[⬆ Back to Top]')) {
                // Ignore separator
            } else if (currentQuestion && line.length > 0) {
                // Handle multiline content
                if (currentQuestion.options.length === 0) {
                    // Continuation of question text
                    currentQuestion.question += ' ' + line;
                } else {
                    // Continuation of the last option text
                    const lastOption = currentQuestion.options[currentQuestion.options.length - 1];
                    if (lastOption) {
                        lastOption.text += ' ' + line;
                    }
                }
            }
        }

        // Push the last question
        if (currentQuestion && currentQuestion.options.length > 0) {
            extractImages(currentQuestion);
            questions.push(currentQuestion);
        }

        return questions;
    } catch (err) {
        console.error('Error reading or parsing README.md:', err);
        return [];
    }
}

function extractImages(question) {
    // Regular expression to match markdown images: ![alt](path)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(question.question)) !== null) {
        const alt = match[1];
        const src = match[2];
        question.images.push({ alt, src });
    }

    // Remove image markdown from question text
    question.question = question.question.replace(imageRegex, '').trim();
}

module.exports = { parseQuestions };
