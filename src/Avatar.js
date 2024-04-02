import { useState, useEffect } from "react";

function Avatar123() {

    const [avatar,setAvatar] = useState()
    
    
    const handlePreviewAvatar = (e) => {
        const file = e.target.files[0];
        
        file.preview = URL.createObjectURL(file);
        setAvatar(file);
    }
    
    useEffect(() => {
        return () => {
            avatar && URL.revokeObjectURL(avatar.preview);
        }
    },[avatar])
    
    return (
        <div>
            <input
                type="file"
                onChange={handlePreviewAvatar}
            />

            {avatar && (
                <img src={avatar.preview} alt="" width="80%"></img>
            )}
        </div>
    )
}

export default Avatar123