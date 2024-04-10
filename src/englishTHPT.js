import { ANSWER_KEY, BOLD_ITALIC_TEXT, answerTypes } from "./utils";

export function detectParentQuestion(paragraph) {
    if (paragraph.component?.length === 1 && paragraph.component[0]?.type === BOLD_ITALIC_TEXT) {
        return true;
    }
    return false;
}

export function detectQuestion(paragraph) {
    const firstWord = paragraph.text?.split(' ')[0];
    if (firstWord === 'Question') return true;
    return false;
}

export function detectAnswers(paragraph, startQuestion) {
    const firstWord = paragraph.text?.split(' ')[0];
    if (ANSWER_KEY.includes(firstWord) && answerTypes.includes(paragraph.component[0]?.type) && startQuestion) {
        return true
    }
    return false;
}

export function handleDetectAnswersInQuestion(paragraph) {
    const { text, component } = paragraph
    const lengthComponents = component?.length;
    const answers = [];
    let startAnswers = false;
    let answer = [];
    for (let i = 0; i < lengthComponents; i++) {
        const { content, type } = component[i];
        if (ANSWER_KEY.some(key => content.includes(key)) && answerTypes.includes(type)) {
            startAnswers = true;
            if (answer.length) answers.push(answer);
            answer = [component[i]];
            continue;
        }
        if (startAnswers) {
            answer.push(component[i])
        }
    }
    if (answer.length) answers.push(answer);

    return answers
}

export function handleDetectAnswerInAnswers(paragraph) {
    const { text, component } = paragraph;
    const lengthComponents = component?.length;
    if (lengthComponents <= 2) return [component];
    let answer = [];
    let answers = [];
    for (let i = 0; i < lengthComponents; i++) {
        const { content, type } = component[i];
        if (ANSWER_KEY.some(key => content.includes(key)) && answerTypes.includes(type)) {
            if (answer.length) answers.push(answer);
            answer = [component[i]];
            continue;
        }
        answer.push(component[i])
    }
    if (answer.length) answers.push(answer);
    return answers;
}



export function splitQuestionsEnglishTHPT(paragraphs) {
    const questions = [];
    let startQuestion = false;
    let startAnswer = false;
    let startSolution = false;
    let startParentQuestion = false;
    let parentQuestion = [];
    let child = [];
    let parentSolution = [];
    let question = [];
    let answer = [];
    let solution = [];
    const lengthParagraph = paragraphs.length
    for (let i = 0; i < lengthParagraph; i++) {
        if (detectParentQuestion(paragraphs[i])) {
            /// reset tai day sau
            startParentQuestion = true;
            startQuestion = false;
            startAnswer = false;
            startSolution = false;

            if (parentQuestion.length) {
                child.push({
                    question: question,
                    answers: answer.length ? answer : null,
                    solution: solution.length ? solution : null
                })
                questions.push({
                    question: parentQuestion,
                    child: child,
                    solution: parentSolution
                })
            }

            // reset
            parentQuestion = [paragraphs[i].component];
            child = [];
            parentSolution = [];
            question = [];
            continue;
        }
        // kiem tra phan tu dau tien
        if (detectQuestion(paragraphs[i])) {
            startQuestion = true;
            startAnswer = false;
            startSolution = false;
            //push dữ liệu vào trong child
            if (question.length) {
                child.push({
                    question: question,
                    answers: answer.length ? answer : null,
                    solution: solution.length ? solution : null
                })
            }

            // reset lai tat ca du lieu temp
            question = [paragraphs[i].component];
            // answer = [];
            solution = [];

            // detect answer trong question;
            answer = handleDetectAnswersInQuestion(paragraphs[i]);

            // next đen vong lap tiep
            continue;

        }

        // push phần tử cuối cùng.
        if (i === lengthParagraph - 1) {
            if (question.length) {
                child.push({
                    question: question,
                    answers: answer.length ? answer : null,
                    solution: solution.length ? solution : null
                })
            }
            questions.push({
                question: parentQuestion,
                child: child,
                solution: parentSolution
            })
        }

        // xử lí logic push answer nếu nó nằm ở đầu câu.
        if (detectAnswers(paragraphs[i], startQuestion)) {
            startAnswer = true;
            const subAnswer = handleDetectAnswerInAnswers(paragraphs[i]);
            for (let j = 0; j < subAnswer.length; j++) {
                answer.push(subAnswer[j]);
            }
            continue;
        }

        // handle table; 
        // hien tai trong de thi thptqd ta thì những table sẽ có đáp án và dịch bài. 
        // Hiện tại check 2 cột sẽ là dịch bài. còn 1 cot là hướng dẫn;
        if (paragraphs[i].table) {
            const table = paragraphs[i].table
            const columns = table[0].length;
            if (columns === 1) { // day la huong dan
                startQuestion = false;
                startAnswer = false;
                startSolution = true;

                solution.push({ table: table });
                continue;
            }
            if (columns === 2) {
                parentSolution.push({ table: table })
                continue;
            }
            continue;
        }

        // chech la huong dan.
        // if (paragraphs[i].text?.trim() === "Hướng dẫn giải" && paragraphs[i].component[0].type === BOLD_TEXT) {
        //     startQuestion = false;
        //     startAnswer = false;
        //     startSolution = true;

        //     solution.push(paragraphs[i].component);
        //     continue;
        // }

        // check cac dong con lai.
        if (startSolution) {
            solution.push(paragraphs[i].component);
        } else if (startAnswer) {
            if (paragraphs[i]?.component) {
                for (let j = 0; j < paragraphs[i].component.length; j++) {
                    answer[answer.length - 1].push(paragraphs[i].component[j])
                }
            }
        } else if (startQuestion) {
            question.push(paragraphs[i].component);
        } else if (startParentQuestion) {
            parentQuestion.push(paragraphs[i].component)
        }
    }
    return questions;
}