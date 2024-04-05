const PART_PATTERN = /^PART\s[1-7]/
const PARENT_PATTERN = /^[qQ]uestions?\s((1?\d{1,2}|200)\-(1?\d{1,2}|200))/
const QUESTION_PATTERN = /^[1-9]\d*\./
const ANSWER_PATTERN = /^\([ABCD]\)\s/
const ANSWER_IN_QUESTION = /\([ABCD]\)\s/g

export function detectPart(text) {
    return PART_PATTERN.test(text ?? '')
}

export function detectParentQuestion(text) {
    return PARENT_PATTERN.test(text ?? '')
}

export function detectQuestion(text) {
    return QUESTION_PATTERN.test(text ?? '')
}

export function detectAnswer(text) {
    return ANSWER_PATTERN.test(text ?? '')
}

export function detectSolution(text) {
    return false;
}

export function detectParentSolution(text) {
    return false;
}

export function handleDetectAnswerInQuestion(paragraph) {
    const isHaveAnswer = ANSWER_IN_QUESTION.test(paragraph.text ?? '')
    if (isHaveAnswer) {
        const subs = paragraph?.text?.split(ANSWER_IN_QUESTION);
        const matches = paragraph?.text?.match(ANSWER_IN_QUESTION);
        const [question, ...answers] = subs
        const _answer = answers.map((answer, index) => (
            [{ content: matches[index] + answer }]
        ))
        return {
            question: [[{ content: question, type: paragraph?.component?.[0]?.type }]],
            answers: _answer
        }
    }
    return {
        question: [paragraph.component],
        answers: [],
    }
}

export function splitQuestionTOEIC(paragraphs) {

    // define 
    const parts = [];

    let partQuestion = [];
    let startPart = false;

    let questions = [];

    let parentQuestion = [];
    let parentSolution = [];
    let startParentQuestion = false;
    let startParentSolution = false;

    let child = [];

    let question = [];
    let answers = [];
    let solution = [];

    let startQuestion = false;
    let startAnswer = false;
    let startSolution = false;

    // logic
    const totalParagraphs = paragraphs.length;
    for (let i = 0; i < totalParagraphs; i++) {
        // lay ra pha tu dang xet
        const _paragraph = paragraphs[i];

        function handlePushRemainParagraph(component) {
            if (startPart) {
                partQuestion.push(component)
            } else if (startParentQuestion) {
                parentQuestion.push(component)
            } else if (startQuestion) {
                question.push(component);
            } else if (startAnswer) {
                if (component) {
                    for (let j = 0; j < component.length; j++) {
                        answers[answers.length - 1].push(component[j])
                    }
                }
            } else if (startSolution) {
                solution.push(component)
            } else if (startParentSolution) {
                parentSolution.push(component)
            }
        }

        function handleParagraph(paragraph) {
            if (detectPart(paragraph.text.trim())) {
                startPart = true;
                startParentQuestion = false;
                startQuestion = false;
                startParentSolution = false;
                startAnswer = false;
                startSolution = false;
                // push du lieu
                if (question.length) {
                    child.push({
                        question: question,
                        answers: answers,
                        solution: solution
                    })
                }

                if (partQuestion.length) {
                    if (questions.length) {
                        parts.push({
                            question: partQuestion,
                            child: questions
                        })
                    } else {
                        parts.push({
                            question: partQuestion,
                            child: child
                        })
                    }
                }

                // reset data;
                partQuestion = [paragraph.component]
                parentSolution = [];
                parentQuestion = [];
                questions = [];
                child = [];
                question = [];
                answers = [];
                solution = [];

                return;
            }

            // nhan dang parent question.    
            if (detectParentQuestion(paragraph.text?.trim())) {
                startParentQuestion = true;
                startPart = false;
                startQuestion = false;
                startParentSolution = false;
                startAnswer = false;
                startSolution = false;

                // push du lieu
                if (parentQuestion.length) {
                    child.push({
                        question: question,
                        answers: answers.length ? answers : null,
                        solution: solution.length ? solution : null
                    })
                    questions.push({
                        question: parentQuestion,
                        child: child,
                        solution: parentSolution
                    })

                    // reset
                    parentQuestion = [paragraph.component];
                    question = [];
                    parentSolution = [];
                    child = [];

                    return;
                }
            }

            // nhan dang question
            if (detectQuestion(paragraph.text?.trim())) {
                startParentQuestion = false;
                startPart = false;
                startQuestion = true;
                startParentSolution = false;
                startAnswer = false;
                startSolution = false;

                if (question.length) {
                    child.push({
                        question: question,
                        answers: answers.length ? answers : null,
                        solution: solution.length ? solution : null
                    })
                }

                const result = handleDetectAnswerInQuestion(paragraph)

                // reset 
                question = result.question;
                solution = [];

                // xu li anser
                answers = result.answers
                return;
            }

            if (detectAnswer(paragraph.text)) {
                // reset 
                startParentQuestion = false;
                startPart = false;
                startQuestion = false;
                startParentSolution = false;
                startAnswer = true;
                startSolution = false;
                answers.push(paragraph.component);

                return;
            }

            if (detectSolution(paragraph.text)) {
                // reset 
                startParentQuestion = false;
                startPart = false;
                startQuestion = false;
                startParentSolution = false;
                startAnswer = false;
                startSolution = true;

                solution.push(paragraph.component);
                return;
            }

            if (detectParentSolution(paragraph.text)) {
                startParentQuestion = false;
                startPart = false;
                startQuestion = false;
                startParentSolution = true;
                startAnswer = false;
                startSolution = false;

                parentSolution.push(paragraph.component);
                return;
            }

            // xu li cac dong con lai;
            handlePushRemainParagraph(paragraph.component)
        }

        // xet truong hop khong phai la bang.
        if (!_paragraph.table) {
            handleParagraph(_paragraph)
        } else { // truong hop la bang
            const rows = _paragraph.table.length;
            if (rows > 1) {
                handlePushRemainParagraph([{
                    table: _paragraph.table
                }])
            } else {
                _paragraph.table.forEach(row => {
                    row.forEach(paragraphs => {
                        paragraphs.forEach(paragraph => {
                            handleParagraph(paragraph);
                        })
                    })
                })
            }
        }

        // pha tu cuoi cung
        if (i === totalParagraphs - 1) {
            if (question.length) {
                child.push({
                    question: question,
                    answers: answers,
                    solution: solution
                })
            }
            if (parentQuestion.length) {
                questions.push({
                    question: parentQuestion,
                    child: child,
                    solution: parentSolution.length ? parentSolution : null
                })
            }

            if (questions.length) {
                parts.push({
                    question: partQuestion,
                    child: questions
                })
            } else {
                parts.push({
                    question: partQuestion,
                    child: child
                })
            }

        }
    }

    return parts

}


