import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const commits = await axios.get('http://localhost:3001/api/commits');
      const quality = await axios.get('http://localhost:3001/api/quality');
      
      const processedData = commits.data.map(commit => ({
        date: new Date(commit.date).toLocaleDateString(),
        filesChanged: commit.files_changed,
        issuesCount: quality.data.filter(q => q.commit_hash === commit.hash).length
      }));

      setData(processedData);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Code Quality Trends</h2>
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ fontSize: '14px', backgroundColor: '#f7fafc', borderColor: '#e2e8f0' }} />
            <Legend verticalAlign="top" height={36} />
            <Line yAxisId="left" type="monotone" dataKey="filesChanged" stroke="#4f46e5" name="Files Changed" />
            <Line yAxisId="right" type="monotone" dataKey="issuesCount" stroke="#16a34a" name="Issues Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
