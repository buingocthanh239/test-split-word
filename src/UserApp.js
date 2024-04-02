import axios from "axios"
import { useEffect, useState } from "react"

export default function UserApp() {
    const [peoples, setPeopeles] = useState([])
    useEffect(() => {
        axios
            .get('https://jsonplaceholder.typicode.com/users')
            .then((res) => {
                setPeopeles(res.data)
            })
            .catch((err) => console.log(err))

    })
    return (
    <>
        <div className="mt-4">
                <table className="table">
                    <thead>
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Name</th>
                            <th scope="col">Username</th>
                            <th scope="col">Email</th>
                            <th scope="col">Phone</th>
                            <th scope="col" >Website</th>
                        </tr>
                    </thead>
                    <tbody>
                        {peoples.map((people) => (
                            <tr key={people.id}>
                                <th scope="row">{people.id}</th>
                                <td>{people.name}</td>
                                <td>{people.username}</td>
                                <td>{people.email}</td>
                                <td>{people.phone}</td>
                                <td>{people.website}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
    </>
    )
}