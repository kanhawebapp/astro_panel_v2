"use client";

import { GetAstrologerAnalytics } from "@/app/utils/panelQueries";
import { useQuery } from "@apollo/client/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d"];

const ButtonTileList = () => {
  const astroUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("astro_user") || "null")
      : null;

  const astrologerId = astroUser?.id;

  const { data, loading, error } = useQuery(
    GetAstrologerAnalytics,
    {
      variables: {
        astrologerId,
      },
      skip: !astrologerId,
      fetchPolicy: "network-only",
    }
  );

  const analytics = data?.getAstrologerAnalytics;

  // Earnings Graph
  const earningsData =
    analytics?.monthlyData?.map((item) => ({
      month: item.month,
      earnings: item.earnings,
    })) || [];

  // Calls & Chats Graph
  const callChatData =
    analytics?.monthlyData?.map((item) => ({
      month: item.month,
      calls: item.calls,
      chats: item.chats,
    })) || [];

  // Monthly Activity Graph
  const activityData =
    analytics?.monthlyData?.map((item) => ({
      month: item.month,
      total: item.calls + item.chats,
    })) || [];

  // Pie Chart
  const sessionDistribution = [
    {
      name: "Calls",
      value: analytics?.totalCalls || 0,
    },
    {
      name: "Chats",
      value: analytics?.totalChats || 0,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Astrology Analytics Dashboard
      </h1>

      {/* Top Cards */}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-gray-500 text-sm">
            Total Earnings
          </h3>

          <p className="text-2xl font-bold text-green-600">
            ₹{analytics?.totalEarnings || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-gray-500 text-sm">
            Followers
          </h3>

          <p className="text-2xl font-bold">
            {analytics?.totalFollowers || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-gray-500 text-sm">
            Total Calls
          </h3>

          <p className="text-2xl font-bold">
            {analytics?.totalCalls || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-gray-500 text-sm">
            Total Chats
          </h3>

          <p className="text-2xl font-bold">
            {analytics?.totalChats || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 shadow">
          <h3 className="text-gray-500 text-sm">
            Rating
          </h3>

          <p className="text-2xl font-bold">
            {Number(
              analytics?.averageRating || 0
            ).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Charts */}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Earnings Trend */}

        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Monthly Earnings ({new Date().getFullYear()})
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="5 2" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="earnings"
                name="Earnings"
                stroke="#8884d8"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Calls vs Chats */}

        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Calls vs Chats
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={callChatData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="calls"
                name="Calls"
                fill="#8884d8"
              />

              <Bar
                dataKey="chats"
                name="Chats"
                fill="#82ca9d"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Activity */}

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-4">
            Monthly Activity
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="total"
                name="Sessions"
                stroke="#8b5cf6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Session Distribution */}

        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Session Distribution
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sessionDistribution}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label
              >
                {sessionDistribution.map(
                  (entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[index % COLORS.length]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ButtonTileList;