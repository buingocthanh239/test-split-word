import { createContext, useContext, useState } from "react"

const NumberContext = createContext(0)

export  function Content() {
    const numberContext = useContext(NumberContext)
    return (
        <div>
            <div>{ numberContext.number}</div>
            <button onClick={numberContext.updateNumber}>update number</button>
        </div>
    )
}

export default function ContextTest() {
    const [number, setNumber] = useState(0)
    const updateNumber = () => {
        setNumber(Math.random())
    }
    return (
        <NumberContext.Provider
        value={{ number, updateNumber}}
        >
            <Content></Content>
        </NumberContext.Provider>
    )
}