import React, { useState } from "react";
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import PizZip from "pizzip";
import { ANSWER_KEY, BOLD_ITALIC_TEXT, splitParagraphs, str2xml, convertQuestionToHTML, answerTypes, detectCorrectAnswerInChoiceQuestion } from "./utils";
import { splitQuestionTOEIC } from "./toeicExam";
import { splitQuestionIELTS } from "./ieltsExam";
import { splitQuestionsEnglishTHPT } from "./englishTHPT";


const DocxReader = () => {

    const [htmlQuestions, setHtmlQuestions] = useState([]);

    const [type, setType] = useState('');

    const handleChange = (event) => {
        setType(event.target.value);
    };

    const handleSplitQuestions = (type) => {
        if (type === 1) return splitQuestionsEnglishTHPT;
        if (type === 2) return splitQuestionTOEIC;
        if (type === 3) return splitQuestionIELTS;
    }

    const onFileUpload = async (event) => {
        const reader = new FileReader();
        let file = event.target.files[0];

        reader.onload = async (e) => {
            const content = e.target.result;
            const zip = new PizZip(content);
            const xml = str2xml(zip.files["word/document.xml"].asText());
            const relationshipsXml = str2xml(zip.files["word/_rels/document.xml.rels"].asText());
            const relationShipElements = relationshipsXml.getElementsByTagName("Relationship");
            const paragraphs = await splitParagraphs(xml, zip, relationShipElements);
            const questions = (handleSplitQuestions(type))(paragraphs);
            const newQuestions = detectCorrectAnswerInChoiceQuestion(questions)
            // console.log(newQuestions)
            const questionHtml = newQuestions.map(question => convertQuestionToHTML(question));
            // console.log(questionHtml)
            setHtmlQuestions(questionHtml);
        };

        reader.onerror = (err) => console.error(err);

        reader.readAsBinaryString(file);
    };

    // render
    const render = (htmlQuestion, i, indexParent) => {
        const correctAnswer = htmlQuestion.correctAnswer;
        const correctChoice = htmlQuestion.answers?.length ? (correctAnswer?.split('-') ?? []) : [];
        const indexQuestion = indexParent ? `${indexParent}.${i + 1}` : (i + 1)
        return (
            <>
                <div style={{ fontWeight: 'bold', color: 'blue' }}>Câu {indexQuestion}:</div>
                <div key={i} style={{ border: "4px ridge", padding: '0 10px', margin: '6px 0' }}>
                    <div dangerouslySetInnerHTML={
                        { __html: htmlQuestion.question }
                    } />
                    {!!htmlQuestion?.child?.length && !!htmlQuestion.solution?.length && <div style={{ border: '4px inset', margin: '6px 0', backgroundColor: htmlQuestion?.child?.length ? 'grey' : 'white' }} dangerouslySetInnerHTML={
                        { __html: htmlQuestion.solution }
                    }></div>}
                    {!!htmlQuestion?.answers?.length && htmlQuestion.answers.map((answer, indx) => (
                        <div key={indx} style={{ border: `1px dotted blue`, margin: '6px 0', backgroundColor: correctChoice?.includes(answer.key.toString()) ? 'yellow' : null }} dangerouslySetInnerHTML={
                            { __html: answer.value }
                        } />
                    ))}
                    {!!htmlQuestion?.child?.length && htmlQuestion?.child?.map((child, index) => render(child, index, indexQuestion))}
                    {!htmlQuestion.answers?.length && htmlQuestion.correctAnswer && <div>
                        <span style={{ fontWeight: 'bold' }}>Đáp án</span>
                        <div style={{ border: '4px ridge', margin: '6px 0', backgroundColor: 'yellow' }} dangerouslySetInnerHTML={
                            { __html: htmlQuestion.correctAnswer }
                        }></div>
                    </div>}
                    {!htmlQuestion?.child?.length && !!htmlQuestion.solution?.length && <div style={{ border: '4px inset', margin: '6px 0', backgroundColor: htmlQuestion?.child?.length ? 'grey' : 'white' }} dangerouslySetInnerHTML={
                        { __html: htmlQuestion.solution }
                    }></div>}

                </div>
            </>
        )
    }



    return <>

        <Box sx={{ width: 120, height: 20, mt: 2, mb: 10 }}>
            <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Loại đề</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={type}
                    label="Loại đề"
                    onChange={handleChange}
                >
                    <MenuItem value={1}>Đề TA THPT</MenuItem>
                    <MenuItem value={2}>Đề Toiec</MenuItem>
                    <MenuItem value={3}>Đề IELTS</MenuItem>
                </Select>
            </FormControl>
        </Box>
        <input type="file" onChange={onFileUpload} name="docx-reader" />
        {/* {!!htmlQuestions.length && htmlQuestions.map((question, index) => (
            <div key={index}>
                <div dangerouslySetInnerHTML={
                    { __html: question.question }
                } />
                {!!question?.child?.length && question.child.map((child, i) => (
                    <div key={i}>
                        <div dangerouslySetInnerHTML={
                            { __html: child.question }
                        } />
                        {!!child?.answers?.length && child.answers.map((answer, indx) => (
                            <div key={indx} dangerouslySetInnerHTML={
                                { __html: answer }
                            } />
                        ))}
                        <div dangerouslySetInnerHTML={
                            { __html: child.solution }
                        } />
                    </div>
                ))}
                <div dangerouslySetInnerHTML={
                    { __html: question.solution }
                }></div>
            </div>
        ))} */}
        {!!htmlQuestions.length && htmlQuestions.map((question, index) => render(question, index))}
    </>
};

export default DocxReader;