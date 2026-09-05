"use client";

import { useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

import { Search } from "lucide-react";

const GET_ASTROLOGER_ASSIGNED_BOOKED_SERVICES = gql`
  query GetAstrologerAssignedBookedServices(
    $page: Int!
    $limit: Int!
  ) {
    getAstrologerAssignedBookedServices(
      page: $page
      limit: $limit
    ) {
      success
      total
      currentPage
      totalPages
      limit

      data {
        id
        name
        dob
        tob
        pob
        gender
        concern
        amount
        paymentStatus
        bookingStatus
        createdAt

        service {
          id
          name
          price
        }
      }
    }
  }
`;

export default function AstrologerAssignedServices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const limit = 20;

  const { data, loading, error } = useQuery(
    GET_ASTROLOGER_ASSIGNED_BOOKED_SERVICES,
    {
      variables: {
        page,
        limit,
      },
      fetchPolicy: "network-only",
    },
  );

 const response =
  data?.getAstrologerAssignedBookedServices;

const services = response?.data || [];

const total = response?.total || 0;

const totalPages = response?.totalPages || 1;

const currentPage = response?.currentPage || 1;

  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        item?.name?.toLowerCase().includes(query) ||
        item?.service?.name?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || item.bookingStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [services, search, statusFilter]);

  if (error) {
    return (
      <div className="p-6 text-red-500">Error loading assigned services</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Assigned Services
        </h1>

        <p className="text-gray-500 mt-1">
          View all healing services assigned to you
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="text-gray-500 text-sm">Total Assigned</h3>

          <h2 className="text-3xl font-bold mt-2">
            {data?.getAstrologerAssignedBookedServices?.total}
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="text-gray-500 text-sm">Completed</h3>

          <h2 className="text-3xl font-bold mt-2">
            {services.filter((s) => s.bookingStatus === "COMPLETED").length}
          </h2>
        </div>

        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="text-gray-500 text-sm">Pending</h3>

          <h2 className="text-3xl font-bold mt-2">
            {services.filter((s) => s.bookingStatus === "PENDING").length}
          </h2>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

            <input
              type="text"
              placeholder="Search by name, service..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
          >
            <option value="ALL">All Status</option>

            <option value="PENDING">Pending</option>

            <option value="COMPLETED">Completed</option>

            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Customer</th>

                <th className="p-4 text-left">Service</th>

                <th className="p-4 text-left">DOB</th>

                <th className="p-4 text-left">Birth Place</th>

                <th className="p-4 text-left">Gender</th>

                <th className="p-4 text-left">Amount</th>

                <th className="p-4 text-left">Payment</th>

                <th className="p-4 text-left">Booking</th>

                <th className="p-4 text-left">Concern</th>

                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-10">
                    Loading services...
                  </td>
                </tr>
              ) : filteredServices.length > 0 ? (
                filteredServices.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    {/* CUSTOMER */}
                    <td className="p-4">
                      <div className="font-semibold">{item.name}</div>
                    </td>

                    {/* SERVICE */}
                    <td className="p-4">
                      <div className="font-medium">{item.service?.name}</div>
                    </td>

                    {/* DOB */}
                    <td className="p-4">
                      {item.dob}
                      <br />
                      <span className="text-xs text-gray-500">{item.tob}</span>
                    </td>

                    {/* POB */}
                    <td className="p-4">{item.pob}</td>

                    {/* GENDER */}
                    <td className="p-4">{item.gender}</td>

                    {/* AMOUNT */}
                    <td className="p-4 font-semibold">₹{item.amount}</td>

                    {/* PAYMENT */}
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.paymentStatus === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>

                    {/* BOOKING */}
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.bookingStatus === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {item.bookingStatus}
                      </span>
                    </td>

                    {/* CONCERN */}
                    <td className="p-4 max-w-xs">
                      <div className="line-clamp-2">{item.concern}</div>
                    </td>


                    {/* DATE */}
                    <td className="p-4 text-sm text-gray-500">
                     {new Date(Number(item.createdAt)).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-gray-500">
                    No assigned services found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-white">
  <div className="text-sm text-gray-600">
    Showing page {currentPage} of {totalPages}
    <span className="ml-2 text-gray-400">
      ({total} records)
    </span>
  </div>

  <div className="flex items-center gap-2">
    <button
      disabled={currentPage === 1 || loading}
      onClick={() => setPage((prev) => prev - 1)}
      className={`px-4 py-2 rounded-lg border transition ${
        currentPage === 1
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      Previous
    </button>

    {Array.from(
      { length: totalPages },
      (_, i) => i + 1
    )
      .slice(
        Math.max(0, currentPage - 3),
        Math.min(totalPages, currentPage + 2)
      )
      .map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => setPage(pageNumber)}
          disabled={loading}
          className={`w-10 h-10 rounded-lg border transition ${
            currentPage === pageNumber
              ? "bg-black text-white"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          {pageNumber}
        </button>
      ))}

    <button
      disabled={
        currentPage >= totalPages || loading
      }
      onClick={() => setPage((prev) => prev + 1)}
      className={`px-4 py-2 rounded-lg border transition ${
        currentPage >= totalPages
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white hover:bg-gray-50"
      }`}
    >
      Next
    </button>
  </div>
</div>
        </div>
      </div>
    </div>
  );
}
