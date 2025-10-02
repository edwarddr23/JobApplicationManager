import React, { useState } from "react";

function Home(){
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [greeting, setGreeting] = useState("");

    const handleSubmit = async () => {
        try{
            setLoading(true);
            setError("");

            const clean_name = name.trim();

            if(clean_name === ""){
                setError('Please enter a name.');
                setLoading(false);
                return;
            }

            const res = await fetch('/greet',
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({ name: clean_name })
                }
            );
            if(!res.ok){
                throw new Error(`Error communicating with server: ${res.status}`)
            }

            const result = await res.json();
            console.log(JSON.stringify(result.greeting))
            setGreeting(result.greeting);
            setLoading(false);
        }
        catch(err){
            const err_msg = `Unexpected error occurred: ${err}`;
            console.error(err_msg);
            setError(err_msg);
        }
    }

    return(
        <div>
            <h1>Home Page</h1>
            <label>
                <input 
                    name='nameInput'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </label>
            <button onClick={handleSubmit}>Submit</button>
            {loading ? (<p>Loading...</p>)
                : error ? (<p>{error}</p>)
                : greeting && (<p>{greeting}</p>)}
        </div>
    );
}

export default Home;