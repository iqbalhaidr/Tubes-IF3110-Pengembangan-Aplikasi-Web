import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">React App Home</h1>
      <p className="mt-4">This is the placeholder home page for the React SPA.</p>
      <Link to="/chat" className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Go to Chat
      </Link>
    </div>
  );
};

export default HomePage;
