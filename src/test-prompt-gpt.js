import OpenAI from "openai";
import { useEffect, useState } from "react";

function TestPromtGpt() {

    const [openAi, setOpenAi] = useState(null)
    const [source, setSource] = useState('')
    const [translate, setTranslate] = useState('')
    const [compareString, setCompareString] = useState('');
    const [result, setResult] = useState('')

    useEffect(() => {
        if (!openAi) {
            setOpenAi(new OpenAI({
                apiKey: process.env.REACT_APP_OPEN_AI_API_KEY, dangerouslyAllowBrowser: true
            }))
        }
    }, [])

    const onChangeSource = (e) => {
        setSource(e?.target?.value)
    }

    const onChangeTranslate = (e) => {
        setTranslate(e?.target?.value)
    }

    const onChangeCompareString = (e) => {
        setCompareString(e?.target?.value)
    }


    const onSubmit = async () => {
        try {
            const completion = await openAi.chat.completions.create({
                messages: [{
                    role: "user", content: `
                    Bạn là một giáo viên tiếng Anh. Bạn hãy giúp học sinh đánh giá ý nghĩa các bản dịch nghĩa của họ so với bản dịch gốc.
                    Văn bản "${source}" có bản dịch "${translate}". Thay bằng bản dịch "${compareString}" có được không?. 
                    Chỉ chọn một trong ba đáp án và không trả về giải thích: 
                    "Tốt",
                    "Trung bình",
                    "Chưa tốt" 
                    ` }],
                model: "gpt-3.5-turbo",
                temperature: 0.1,
                max_tokens: 4096 - prompt.length,
            });
            const resultText = completion.choices[0]?.message?.content ?? "";
            setResult(Array
                .from(resultText)
                .filter((char) => {
                    // eslint-disable-next-line no-misleading-character-class
                    if (/^[a-z\u0111\u0300\u0301\u0302\u0303\u0306\u0309\u031b\u0323]+$/i.test(char.normalize("NFD"))) {
                        return true;
                    }
                    if (/^\s{1,}$/.test(char)) {
                        return true;
                    }
                    return false;
                })
                .join("")
                .toLowerCase())
        } catch (e) {
            console.log(e)
            return ''
        }
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div> <label>Câu gốc: </label> <textarea value={source} onChange={onChangeSource} /></div>
            <div> <label>Bản dịch gốc</label> <textarea value={translate} onChange={onChangeTranslate} /></div>
            <div><label>Bản dịch mới</label> <textarea value={compareString} onChange={onChangeCompareString} /></div>
            <button style={{ width: '100px' }} onClick={onSubmit}>Kiểm tra</button>
            <div style={{ color: 'red' }}>Kết quả: {result} </div>
        </div>
    );
}

export default TestPromtGpt;