import React from 'react';
import Dashboard from './components/Dashboard';
import "./App.css"

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <header className="w-full py-6 bg-indigo-600 shadow-lg">
        <h1 className="text-3xl text-center text-white font-bold">Code Quality Monitor</h1>
      </header>
      <main className="w-full flex-grow flex justify-center items-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
          <Dashboard />
        </div>
      </main>
      <footer className="w-full py-4 bg-gray-800 text-white text-center">
        <p>&copy; {new Date().getFullYear()} Code Quality Monitor. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
