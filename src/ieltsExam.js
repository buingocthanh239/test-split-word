import { BOLD_HIGHLIGHT_TEXT, HIGHLIGHT_TEXT, NORMAL_TEXT, detectCorrectAnswerInChoiceQuestion } from "./utils"

const PART_SPEAKING_PATTERN = /^SPEAKING\sPART\s\d/
const PART_WRITING_PATTERN = /^WRITING\sTASK\s\d/
const PART_LISTENING_PATTERN = /^SECTION\s\d/
const PART_READING_PATTERN = /^READING\sPASSAGE\s\d/
const PARENT_PATTERN = /^Questions?\s/
//([1-9]\d*|[1-9]\d*-[1-9]\d*)
const QUESTION_PATTERN = /^[1-9]\d*\./
const ANSWER_PATTERN = /^[A-Z]\.\s/
const ANSWER_IN_QUESTION = /[ABCD]\.\s/g
const SOLUTION_PATTERN = /^Giải\sThích/i
const CORRECT_PATTERN = /^[1-9]\d*\./g

const PART_PATTERNS = [PART_SPEAKING_PATTERN, PART_WRITING_PATTERN, PART_LISTENING_PATTERN, PART_READING_PATTERN]
const CORRECT_ANSWER_TYPE = [BOLD_HIGHLIGHT_TEXT, HIGHLIGHT_TEXT]

export function detectPart(text) {
    return PART_PATTERNS.some(patterns => patterns.test(text ?? ''))
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
    return SOLUTION_PATTERN.test(text ?? '');
}

export function detectParentSolution(text) {
    return SOLUTION_PATTERN.test(text ?? '');
}

export function detectPartSolution(text) {
    return SOLUTION_PATTERN.test(text ?? '')
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

export function detectCorrectAnswerInFillQuestion(question) {
    const isQuestion = CORRECT_PATTERN.test(question[0][0].content ?? '');
    if (isQuestion && CORRECT_ANSWER_TYPE.includes(question[0][0].type)) {
        return true
    }
    return false;
}

export function splitQuestionIELTS(paragraphs) {

    // define 
    const parts = [];

    let partQuestion = [];
    let startPart = false;

    let partSolution = [];
    let startPartSolution = false;

    let questions = [];

    let parentQuestion = [];
    let parentSolution = [];
    let parentAnswer = [];
    let startParentQuestion = false;
    let startParentSolution = false;
    let startParentAnswer = [];

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
            } else if (startParentAnswer) {
                parentAnswer.push(component);
            } else if (startPartSolution) {
                partSolution.push(component)
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
                startParentAnswer = false;
                startPartSolution = false;
                // push du lieu
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
                        answers: parentAnswer,
                        solution: parentSolution
                    })
                }

                if (partQuestion.length) {
                    if (questions.length) {
                        parts.push({
                            question: partQuestion,
                            solution: partSolution.length ? partSolution : null,
                            child: questions
                        })
                    } else {
                        parts.push({
                            question: partQuestion,
                            solution: partSolution.length ? partSolution : null,
                            child: child
                        })
                    }
                }

                // reset data;
                partQuestion = [paragraph.component]
                parentSolution = [];
                parentQuestion = [];
                parentAnswer = [];
                questions = [];
                child = [];
                question = [];
                answers = [];
                solution = [];
                partSolution = [];
                return;
            }

            if (detectAnswer(paragraph.text?.trim()) && (startParentQuestion || startParentAnswer)) {
                // reset 
                startParentQuestion = false;
                startPart = false;
                startQuestion = false;
                startParentSolution = false;
                startAnswer = false;
                startSolution = false;
                startParentAnswer = true;
                startPartSolution = false;
                parentAnswer.push(paragraph.component);
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
                startParentAnswer = false;
                startPartSolution = false;

                // push du lieu
                if (parentQuestion.length) {
                    if (question.length) {
                        child.push({
                            question: question,
                            answers: answers.length ? answers : null,
                            solution: solution.length ? solution : null
                        })
                    }
                    questions.push({
                        question: parentQuestion,
                        child: child,
                        solution: parentSolution,
                        answers: parentAnswer
                    })

                    // reset
                    parentQuestion = [paragraph.component];
                    question = [];
                    parentSolution = [];
                    parentAnswer = [];
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
                startParentAnswer = false;
                startPartSolution = false;
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

            if (detectAnswer(paragraph.text) && (startAnswer || startQuestion)) {
                // reset 
                startParentQuestion = false;
                startPart = false;
                startQuestion = false;
                startParentSolution = false;
                startAnswer = true;
                startSolution = false;
                startParentSolution = false;
                answers.push(paragraph.component);

                return;
            }

            if (detectPartSolution(paragraph.text) && (startPart || startPartSolution)) {
                startParentQuestion = false;
                startPart = false;
                startQuestion = false;
                startParentSolution = false;
                startAnswer = false;
                startSolution = false;
                startPartSolution = true;
                partSolution.push(paragraph.component);
                return;
            }

            if (detectSolution(paragraph.text) && (startQuestion || startSolution || startAnswer)) {
                // reset 
                startParentQuestion = false;
                startPart = false;
                startQuestion = false;
                startParentSolution = false;
                startAnswer = false;
                startSolution = true;
                startPartSolution = false;
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
                startPartSolution = false;
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
            // const rows = _paragraph.table.length;
            // if (rows > 1) {
            //     handlePushRemainParagraph([{
            //         table: _paragraph.table
            //     }])
            // } else {
            //     _paragraph.table.forEach(row => {
            //         row.forEach(paragraphs => {
            //             paragraphs.forEach(paragraph => {
            //                 handleParagraph(paragraph);
            //             })
            //         })
            //     })
            // }
            handlePushRemainParagraph([{
                table: _paragraph.table
            }])
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
                    answers: parentAnswer,
                    solution: parentSolution.length ? parentSolution : null
                })
            }

            if (questions.length) {
                parts.push({
                    question: partQuestion,
                    solution: partSolution.length ? partSolution : null,
                    child: questions
                })
            } else {
                parts.push({
                    question: partQuestion,
                    solution: partSolution.length ? partSolution : null,
                    child: child
                })
            }

        }
    }
    //return parts

    // format questions
    return parts.map(part => {
        const { child, ...remain } = part;
        if (!child || !child?.length) return part;
        const newChild = child.map(cd => {
            const { question, answers, child, ...remainChild } = cd;
            const _child = cd.child
            const _question = cd.question;
            if (answers && answers.length) return cd;
            if (!_child || !_child?.length) return cd;
            const newChildrenOfChild = [];
            _child.forEach(c => {
                const { answers, question, ...remainChildOfChild } = c;
                if (answers && answers.length) {
                    return newChildrenOfChild.push(c);
                }
                if (!detectCorrectAnswerInFillQuestion(question)) {
                    question.forEach(para => _question.push(para));
                } else {
                    // gop thanh 1 đoạn.
                    const text = question.reduce((paraText, para) => {
                        return paraText + ' ' + para.reduce((text, item) => text + item.content, '');
                    }, '');
                    const correctAnswer = text.trim().split(CORRECT_PATTERN)[1];
                    const q = text.trim().match(CORRECT_PATTERN)[0];
                    if (!!correctAnswer && !!q) {
                        return newChildrenOfChild.push({
                            ...remainChildOfChild,
                            question: [[{ content: q, type: NORMAL_TEXT }]],
                            correctAnswer: correctAnswer
                        })
                    }
                    return;
                }
            });
            return {
                ...remainChild,
                question: _question,
                answers: answers,
                child: newChildrenOfChild
            }
        })
        return {
            ...remain,
            child: newChild
        }
    })
}


