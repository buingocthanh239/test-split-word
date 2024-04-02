import React, { useState } from "react";
import PizZip from "pizzip";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";

const IMAGE_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
const ANSWER_KEY = ['A', 'B', 'C', 'D', 'A.', 'B.', 'C.', 'D.', '(A)', '(B)', '(C)', '(D)'];
const QUESTION_KEY = ['Question', 'Câu'];
const SOLUTION_KEY = ['Hướng dẫn giải']

const NORMAL_TEXT = 0;
const BOLD_TEXT = 1;
const ITALIC_TEXT = 2;
const UNDERLINE_TEXT = 3;
const HIGHLIGHT_TEXT = 4;
const BOLD_ITALIC_TEXT = 5;
const BOLD_UNDERLINE_TEXT = 6;
const BOLD_HIGHLIGHT_TEXT = 7;
const BOLD_ITALIC_UNDERLINE_TEXT = 8;

const answerTypes = [BOLD_TEXT, BOLD_ITALIC_TEXT, BOLD_UNDERLINE_TEXT, BOLD_HIGHLIGHT_TEXT, BOLD_ITALIC_UNDERLINE_TEXT]

// phan loai text
function getTypeText(style) {
    const { isBold, isHightLine, isUnderline, isItalic } = style
    if (isBold && isItalic && isUnderline) return 7;
    if (isBold && isItalic && isUnderline) return 8;
    if (isBold && isItalic) return 5;
    if (isBold && isUnderline) return 6;
    if (isBold) return 1;
    if (isItalic) return 2;
    if (isUnderline) return 3;
    if (isHightLine) return 4;
    return NORMAL_TEXT
}

// xu li bai toan tai 1 doan van:
function getComponentInParagraph(paragraphsElement) {
    const paragraph = [];
    const runComponent = paragraphsElement.getElementsByTagName('w:r');
    for (let i = 0; i < runComponent.length; i++) {
        const runNode = runComponent[i];
        // run la tag text
        const textComponent = runNode.getElementsByTagName('w:t');
        if (textComponent.length) {
            const textValue = textComponent[0].textContent;
            if (textValue) {
                const styleXml = (runNode.getElementsByTagName('w:rPr') ?? [])[0];
                const isBold = (styleXml?.getElementsByTagName('w:b') ?? []).length;
                const isHighlight = (styleXml?.getElementsByTagName('w:highlight') ?? []).length;
                const isUnderline = (styleXml?.getElementsByTagName('w:u') ?? []).length;
                const isItalic = (styleXml?.getElementsByTagName('w:i') ?? []).length;
                const textType = getTypeText({ isBold, isHighlight, isUnderline, isItalic });
                paragraph.push({
                    content: textValue,
                    type: textType
                })
            }
        }

        // run la object se xu li sau.
    }
    // format lại dư liệu. 
    // b1: loai bo ki tu trong. 
    const removeSpaceParagraphs = [];
    let fullText = '';
    for (let i = 0; i < paragraph.length; i++) {
        // them cac type media tai day
        if (paragraph[i].type !== 'IMAGE' && !paragraph[i].content?.trim()) {
            if (i === paragraph.length - 1) break;
            paragraph[i + 1].content = ' ' + paragraph[i + 1]?.content;
            continue;
        }
        removeSpaceParagraphs.push(paragraph[i]);
        fullText += paragraph[i].content;
    }
    // // b2: gop nhung doan van co cung loai lai voi nhau. 
    const formatParagraphs = [];
    for (let i = 0; i < removeSpaceParagraphs.length; i++) {
        if (removeSpaceParagraphs[i].type !== 'IMAGE' && removeSpaceParagraphs[i].type === removeSpaceParagraphs[i + 1]?.type) {
            removeSpaceParagraphs[i + 1].content = removeSpaceParagraphs[i].content + removeSpaceParagraphs[i + 1].content;
            continue;
        }
        formatParagraphs.push(removeSpaceParagraphs[i])
    }
    // console.log(paragraph);
    return {
        text: fullText,
        component: formatParagraphs
    };
}

// tạo dom xml
function str2xml(str) {
    if (str.charCodeAt(0) === 65279) {
        // BOM sequence
        str = str.substr(1);
    }
    return new DOMParser().parseFromString(str, "text/xml");
}

function splitParagraphs(xml) {
    const childBody = xml.getElementsByTagName('w:body')[0].childNodes;
    const paragraphs = [];
    for (let i = 0, childLength = childBody.length; i < childLength; i++) {
        const nodeName = childBody[i].nodeName;
        const node = childBody[i];
        // xử lí là đoạn văn. 
        if (nodeName === 'w:p') {
            // lay ta ca cac doan van ra:
            const component = getComponentInParagraph(node);
            paragraphs.push(component);
        }
        if (nodeName === 'w:tbl') {
            // lay cac row trong table
            const rows = node.getElementsByTagName('w:tr') ?? [];
            const table = [];
            for (let j = 0, len = rows.length; j < len; j++) {
                // lay ô trong row
                const rowsValue = [];
                const squares = rows[j].getElementsByTagName('w:tc') ?? [];
                for (let k = 0; k < squares.length; k++) {
                    const paragraphNodes = squares[k].getElementsByTagName('w:p');
                    const paragraphs = [];
                    for (let h = 0; h < paragraphNodes.length; h++) {
                        const paragraph = getComponentInParagraph(paragraphNodes[h]);
                        // push ca doan vao 1 o
                        paragraphs.push(paragraph);
                    }
                    // push cac o vao 1 row
                    rowsValue.push(paragraphs);
                }
                // push cac cac row vao trong bang
                table.push(rowsValue);
            }

            paragraphs.push(table);
        }
    }
    return paragraphs
}

function detectParentQuestion(paragraph) {
    if (paragraph.component?.length === 1 && paragraph.component[0]?.type === BOLD_ITALIC_TEXT) {
        return true;
    }
    return false;
}

function detectQuestion(paragraph) {
    const firstWord = paragraph.text?.split(' ')[0];
    if (firstWord === 'Question') return true;
    return false;
}

function detectAnswers(paragraph, startQuestion) {
    const firstWord = paragraph.text?.split(' ')[0];
    if (ANSWER_KEY.includes(firstWord) && answerTypes.includes(paragraph.component[0]?.type) && startQuestion) {
        return true
    }
    return false;
}

function handleDetectAnswersInQuestion(paragraph) {
    const { text, component } = paragraph
    const lengthComponents = component?.length;
    const answers = [];
    let startAnswers = false;
    let answer = [];
    for (let i = 0; i < lengthComponents; i++) {
        const { content, type } = component[i];
        // console.log(content)
        if (ANSWER_KEY.some(key => content.includes(key)) && answerTypes.includes(type)) {
            startAnswers = true;
            if (answer.length) answers.push(answer);
            answer = [];
            continue;
        }
        if (startAnswers) {
            answer.push(component[i])
        }
    }
    if (answer.length) answers.push(answer);

    return answers
}

function handleDetectAnswerInAnswers(paragraph) {
    const { text, component } = paragraph;
    const lengthComponents = component?.length;
    if (lengthComponents <= 2) return [component];
    let answer = [];
    let answers = [];
    for (let i = 0; i < lengthComponents; i++) {
        const { content, type } = component[i];
        if (ANSWER_KEY.some(key => content.includes(key)) && answerTypes.includes(type)) {
            if (answer.length) answers.push(answer);
            answer = [];
            continue;
        }
        answer.push(component[i])
    }
    if (answer.length) answers.push(answer);
    return answers;
}

function convertContentToHtml(subPara) {
    const { content, type } = subPara;
    switch (type) {
        case BOLD_TEXT:
        case BOLD_HIGHLIGHT_TEXT:
            return `<b>${content}</b>`;
        case ITALIC_TEXT:
            return `<i>${content}</i>`
        case UNDERLINE_TEXT:
            return `<ins>${content}</ins>`
        case BOLD_ITALIC_TEXT:
            return `<b><i>${content}</i></b>`
        case BOLD_UNDERLINE_TEXT:
            return `<b><ins>${content}</ins></b>`
        case BOLD_ITALIC_UNDERLINE_TEXT:
            return `<b><ins><i>${content}</i></ins></b>`
        default:
            return content;

    }
}

function convertQuestionToHTML(_question) {
    const { question, answer, solution, child } = _question;
    let htmlQuestion = '';
    let htmlAnswers = [];
    let htmlSolution = '';
    let htmlChild = [];
    if (question && question.length) {
        question.forEach(paragraph => {
            let htmlPara = ''
            paragraph?.forEach(subParagraph => {
                htmlPara += convertContentToHtml(subParagraph)
            })
            htmlQuestion += `<p>${htmlPara}</p>`
        })
    }
    if (solution) {
        solution.forEach(paragraph => {
            let htmlPara = ''
            paragraph.forEach(subParagraph => {
                htmlPara += convertContentToHtml(subParagraph)
            })
            htmlSolution += `<p>${htmlPara}</p>`
        })
    }

    if (answer) {
        htmlAnswers = answer.map(item => {
            let htmlPara = ''
            item.forEach(subPara => {
                htmlPara += convertContentToHtml(subPara);
            })
            return `<p>${htmlPara}</p>`
        })
    }

    if (child && child.length) {
        htmlChild = child.map(item => convertQuestionToHTML(item))
    }

    return {
        question: htmlQuestion,
        answers: htmlAnswers,
        solution: htmlSolution,
        child: htmlChild.length ? htmlChild : null
    }
}


const DocxReader = () => {

    function splitQuestions(content) {
        const zip = new PizZip(content);
        const xml = str2xml(zip.files["word/document.xml"].asText());

        const paragraphs = splitParagraphs(xml)

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
                // console.log(paragraphs[i].text)
                if (parentQuestion.length) {
                    child.push({
                        question: question,
                        answer: answer.length ? answer : null,
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
                        answer: answer.length ? answer : null,
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
                        answer: answer.length ? answer : null,
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

            // chech la huong dan.
            if (paragraphs[i].text?.trim() === "Hướng dẫn giải" && paragraphs[i].component[0].type === BOLD_TEXT) {
                startQuestion = false;
                startAnswer = false;
                startSolution = true;

                solution.push(paragraphs[i].component);
                continue;
            }

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

    const [htmlQuestions, setHtmlQuestions] = useState([]);

    const onFileUpload = (event) => {
        const reader = new FileReader();
        let file = event.target.files[0];

        reader.onload = (e) => {
            const content = e.target.result;
            const questions = splitQuestions(content);
            const questionHtml = questions.map(question => convertQuestionToHTML(question));
            console.log(questionHtml);
            setHtmlQuestions(questionHtml);
        };

        reader.onerror = (err) => console.error(err);

        reader.readAsBinaryString(file);
    };

    return <>
        <input type="file" onChange={onFileUpload} name="docx-reader" />
        {!!htmlQuestions.length && htmlQuestions.map((question, index) => (
            <div key={index}>
                <div dangerouslySetInnerHTML={
                    { __html: question.question }
                } />
                {question?.child?.length && question.child.map((child, i) => (
                    <div key={i}>
                        <div dangerouslySetInnerHTML={
                            { __html: child.question }
                        } />
                        {child?.answers?.length && child.answers.map((answer, indx) => (
                            <div key={indx} dangerouslySetInnerHTML={
                                { __html: answer }
                            } />
                        ))}
                    </div>
                ))}
            </div>
        ))}
    </>
};

export default DocxReader;