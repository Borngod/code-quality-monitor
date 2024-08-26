import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Dashboard = ({ owner, repo }) => {
  const [data, setData] = useState([]);
  const [severityData, setSeverityData] = useState([]);
  const [fileIssuesData, setFileIssuesData] = useState([]);
  const [authorData, setAuthorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const commits = await axios.get(`http://localhost:3001/api/commits`);
        const quality = await axios.get(`http://localhost:3001/api/quality`);
        if (!commits.data || !quality.data) {
          throw new Error("No data received from the API");
        }

        // Rest of the data processing logic...

        const processedData = commits.data.map((commit) => ({
          date: new Date(commit.date).toLocaleDateString(),
          filesChanged: commit.files_changed || 0, // Assuming you add this field
          issuesCount: quality.data.filter((q) => q.commit_hash === commit.hash)
            .length,
          highSeverity: quality.data.filter(
            (q) => q.commit_hash === commit.hash && q.severity === "high"
          ).length,
          mediumSeverity: quality.data.filter(
            (q) => q.commit_hash === commit.hash && q.severity === "medium"
          ).length,
          lowSeverity: quality.data.filter(
            (q) => q.commit_hash === commit.hash && q.severity === "low"
          ).length,
        }));

        const severityCounts = {
          high: quality.data.filter((q) => q.severity === "high").length,
          medium: quality.data.filter((q) => q.severity === "medium").length,
          low: quality.data.filter((q) => q.severity === "low").length,
        };

        const severityData = [
          { name: "High Severity", value: severityCounts.high },
          { name: "Medium Severity", value: severityCounts.medium },
          { name: "Low Severity", value: severityCounts.low },
        ];

        const fileIssuesMap = quality.data.reduce((acc, issue) => {
          acc[issue.file] = (acc[issue.file] || 0) + 1;
          return acc;
        }, {});

        const fileIssuesData = Object.entries(fileIssuesMap).map(
          ([file, count]) => ({ file, count })
        );

        const authorCommitsMap = commits.data.reduce((acc, commit) => {
          acc[commit.author] = (acc[commit.author] || 0) + 1;
          return acc;
        }, {});

        const authorData = Object.entries(authorCommitsMap).map(
          ([author, count]) => ({ author, count })
        );

        setData(processedData);
        setSeverityData(severityData);
        setFileIssuesData(fileIssuesData);
        setAuthorData(authorData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(`Failed to fetch data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [owner, repo]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <p className="mt-4 text-gray-600">Please check your API server and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Code Quality Dashboard
      </h2>
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl mb-10">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Code Quality Trends
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                fontSize: "14px",
                backgroundColor: "#f7fafc",
                borderColor: "#e2e8f0",
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="filesChanged"
              stroke="#4f46e5"
              name="Files Changed"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="issuesCount"
              stroke="#16a34a"
              name="Issues Count"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="highSeverity"
              stroke="#dc2626"
              name="High Severity Issues"
              dot={{ r: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="mediumSeverity"
              stroke="#f59e0b"
              name="Medium Severity Issues"
              dot={{ r: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="lowSeverity"
              stroke="#34d399"
              name="Low Severity Issues"
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl mb-10">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Issue Severity Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={severityData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {severityData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === "High Severity"
                      ? "#dc2626"
                      : entry.name === "Medium Severity"
                      ? "#f59e0b"
                      : "#34d399"
                  }
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl mb-10">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Top Files with Issues
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fileIssuesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="file" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="count" fill="#4f46e5" name="Issue Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Top Contributors
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={authorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="author" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="count" fill="#10b981" name="Commits" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
