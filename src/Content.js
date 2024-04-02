import { useState, useEffect } from "react";

function Content () {
    const [posts, setPosts] = useState([])
    const [type, setType] = useState('posts')
    const [showGoToTop,setShowGoToTop] = useState(false)
    const tabs = ['posts','comments','albums']


    useEffect(() => {
        fetch(`https://jsonplaceholder.typicode.com/${type}`)
            .then(res => res.json())
            .then( post => {
                setPosts(post)
                console.log(posts)
            });
       },[type])

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY>=200) {
                setShowGoToTop(true)
            } else {
                setShowGoToTop(false)
            }
        }

        window.addEventListener('scroll', handleScroll)

        //cleanup : dọn dẹp các phần trong bộ nhớ trc khi component bị unmounted
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    },[] )

    return (
        <div>
            {tabs.map(tab => (
                <button
                    key = {tab}
                    onClick = {() => setType(tab) }
                >
                    {tab}
                </button>
            ))}
            <ul>
                {posts.map(post => (
                    <li key={post.id}>{post.title}</li>
                ))}
            </ul>

            {showGoToTop && (
                <button
                    style={{
                        position: 'fixed',
                        right: 20,
                        bottom: 20,
                    }}
                >
                    go to top
                </button>
            ) }
        </div>
    )
}

export default Content;