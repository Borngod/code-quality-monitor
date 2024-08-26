import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [message, setMessage] = useState("");
  const [fetchTrigger, setFetchTrigger] = useState(false); // Trigger Dashboard data fetch
  const [loading, setLoading] = useState(false); // Manage loading state

  const fetchData = async () => {
    setMessage(""); // Clear previous messages
    setFetchTrigger(false); // Reset fetch trigger
    setLoading(true); // Start loading

    try {
      const response = await fetch("http://localhost:3001/api/fetch-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner, repo }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data");
      }

      setMessage(result.message);
      setFetchTrigger(true); // Trigger Dashboard data fetch only after success
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 to-blue-100 flex flex-col items-center justify-center">
      <header className="w-full py-6 bg-indigo-600 shadow-lg rounded-t-lg">
        <h1 className="text-3xl text-center text-white font-bold">
          Code Quality Monitor
        </h1>
      </header>
      <main className="w-full flex-grow flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8 mb-4 border border-gray-200">
          <div className="flex flex-col space-y-4 mb-4">
            <input
              className="border rounded p-2"
              type="text"
              placeholder="Repository Owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              disabled={loading} // Disable input during loading
            />
            <input
              className="border rounded p-2"
              type="text"
              placeholder="Repository Name"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              disabled={loading} // Disable input during loading
            />
            <button
              className={`bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={fetchData}
              disabled={loading} // Disable button during loading
            >
              {loading ? "Fetching Data..." : "Fetch Data"}
            </button>
          </div>
          {message && <p className="text-center text-green-600">{message}</p>}
        </div>
        {loading && (
          <div className="text-center mb-4">
            <p className="text-blue-600">Loading...</p>
          </div>
        )}
        {fetchTrigger && !loading && (
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8 border border-gray-200">
            <Dashboard owner={owner} repo={repo} />
          </div>
        )}
      </main>
      <footer className="w-full py-4 bg-gray-800 text-white text-center rounded-b-lg">
        <p>
          &copy; {new Date().getFullYear()} Code Quality Monitor. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
