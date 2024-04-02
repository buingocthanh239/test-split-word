import { useState, useEffect } from "react";

function CountDown() {
    const [countdown, setCountdown] = useState(180)

    useEffect(() => {
        setTimeout(() => {
            setCountdown(countdown-1)
        },1000) 

        return () => clearTimeout()
    },[countdown])

    return (
        <div>
            <h1>{countdown}</h1>
        </div>
    )

}

export default CountDown