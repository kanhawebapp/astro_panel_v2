"use client";
import { useState, useMemo, useRef } from "react";
import {
  FaFilter,
  FaCalendarAlt,
  FaWallet,
  FaMoneyCheckAlt,
  FaPercentage,
} from "react-icons/fa";
import { useGetWalletTransactionsQuery } from "@/app/redux/slice/walletSlice";
import styles from "@/app/UI/features/SettingPages/Pages/profile.module.css";
import BasicPagination from "../../PaginationUI/Pagination";

const SummaryCard = ({
  title,
  value,
  icon,
  color = "bg-white",
  textColor = "text-gray-600",
}) => (
  <div className={`${color} rounded-xl p-3 shadow-lg w-full flex flex-col items-center`}>
    <div className="text-center flex flex-col items-center">
      <p className={`text-sm font-medium mb-1 flex items-center justify-center gap-2 ${textColor}`}>
        {title} {icon && <span>{icon}</span>}
      </p>
      <p className={`text-xl font-bold ${textColor}`}>
        {value === "N/A"
          ? value
          : `₹ ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </p>
    </div>
  </div>
);

const FilterControls = ({
  filterType,
  setFilterType,
  customRange,
  setCustomRange,
  onReset,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  return (
    <div className="gap-4 items-end flex flex-col md:flex-row w-full relative">
      <div className="flex items-center gap-4 mb-4 md:mb-0 relative">
        <div className="bg-violet-100 p-2 rounded-lg">
          <FaFilter className="h-5 w-5 text-violet-600" />
        </div>
        <select
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
          value={filterType}
          aria-label="Filter by date range"
          onChange={(e) => {
            setFilterType(e.target.value);
            if (e.target.value === "custom_range") setShowCustom(true);
            else setShowCustom(false);
          }}
        >
          <option value="all">All Transactions</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="custom_range">Custom Range</option>
        </select>
        <button
          className="ml-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-xs"
          onClick={onReset}
          aria-label="Reset filters"
        >
          Reset Filters
        </button>
        {filterType === "custom_range" && showCustom && (
          <div className="absolute left-0 top-full mt-2 z-20 bg-white p-4 rounded-xl shadow-xl w-72 flex flex-col gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                value={customRange.start}
                max={customRange.end || undefined}
                onChange={(e) =>
                  setCustomRange((prev) => ({
                    ...prev,
                    start: e.target.value,
                  }))
                }
                aria-label="Start date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                value={customRange.end}
                min={customRange.start || undefined}
                disabled={!customRange.start}
                onChange={(e) =>
                  setCustomRange((prev) => ({
                    ...prev,
                    end: e.target.value,
                  }))
                }
                aria-label="End date"
              />
            </div>
            <button
              className="mt-2 px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
              onClick={() => setShowCustom(false)}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="py-3 px-6">
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
      </td>
    ))}
  </tr>
);

const TransactionTable = ({ user_id }) => {
  const [filterType, setFilterType] = useState("today");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [page, setPage] = useState(1);
  const tableRef = useRef(null);

  const { data, isLoading } = useGetWalletTransactionsQuery({
    page,
    per_page: 10,
    filter: filterType,
    user_id,
    from_date: customRange.start,
    to_date: customRange.end,
  });

  const transactions = data?.transactions || [];
  const summary = data?.summary || {
    totalPaidAmount: 0,
    totalPGAmount: 0,
    totalTDSAmount: 0,
    totalEarningAmount: 0,
  };
  const pagination = data?.pagination || {};

  const availableBalanceNum = useMemo(
    () => summary.totalEarningAmount || 0,
    [summary]
  );
  const pgCharge = useMemo(
    () => (availableBalanceNum * 2.5) / 100,
    [availableBalanceNum]
  );
  const subTotal = useMemo(
    () => availableBalanceNum - pgCharge,
    [availableBalanceNum, pgCharge]
  );
  const tds = useMemo(() => (subTotal * 10) / 100, [subTotal]);
  const payableAmount = useMemo(() => subTotal - tds, [subTotal, tds]);

  const handlePageChange = (p) => {
    setPage(p);
    if (tableRef.current)
      tableRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleReset = () => {
    setFilterType("all");
    setCustomRange({ start: "", end: "" });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-2 md:px-4 sm:px-6 lg:px-8 ">
        <div className="bg-white rounded-xl shadow-lg p-3 md:p-6 mb-8 flex flex-col md:flex-row gap-2 md:gap-6 items-start md:items-center w-full md:justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <h2 className="md:text-2xl text-sm font-bold text-gray-900">
              Wallet Transactions
            </h2>
          </div>
          <div className="w-full md:w-auto flex justify-end">
            <FilterControls
              filterType={filterType}
              setFilterType={setFilterType}
              customRange={customRange}
              setCustomRange={setCustomRange}
              onReset={handleReset}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <SummaryCard
            title="Available Balance"
            value={availableBalanceNum}
            color="bg-[#7e60bf]"
            textColor="text-white"
          />
          <SummaryCard
            title="PG Charges @ 2.5%"
            value={pgCharge}
          />
          <SummaryCard
            title="Sub Total"
            value={subTotal}
          />
          <SummaryCard
            title="TDS @ 10%"
            value={tds}
          />
          <SummaryCard title="GST" value="N/A" />
          <SummaryCard
            title="Payable Amount"
            value={payableAmount}
            color="text-green-600"
          />
        </div>
        <div className="bg-white rounded-xl shadow-lg w-full" ref={tableRef}>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm md:text-xl font-semibold text-gray-900">
              Transaction History
            </h3>
            <div className="bg-violet-100 md:px-4 px-3  md:py-2 md:rounded-full">
              <span className="text-violet-700 text-xs font-medium">
                {pagination.total || 0} transactions
                {filterType !== "all" && " (filtered)"}
              </span>
            </div>
          </div>
          {isLoading ? (
            <table className="w-full text-sm">
              <tbody>
                {[...Array(10)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                <FaCalendarAlt className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No data found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No transactions found for selected filter.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <div className="w-[70vw]">
                  <table className="lg:w-[77vw] w-[100vw] text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-6 text-left font-semibold">
                          Order ID
                        </th>
                        <th className="py-3 px-6 text-left font-semibold">
                          Category
                        </th>
                       
                        <th className="py-3 px-6 text-left font-semibold">
                          Date
                        </th>
                        <th className="py-3 px-6 text-left font-semibold">
                          Type
                        </th>
                        <th className="py-3 px-6 text-center font-semibold">
                          Remark
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-violet-50 transition-colors"
                        >
                          <td className="py-3 px-6 font-mono">
                            {tx.transaction_id}
                          </td>
                          <td className="py-3 px-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {tx.product_type}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-6 font-semibold ${
                              tx.transaction_type === "credit"
                                ? "text-green-600 bg-green-50"
                                : tx.transaction_type === "debit"
                                ? "text-red-600 bg-red-50"
                                : "text-yellow-600 bg-yellow-50"
                            }`}
                          >
                            ₹{" "}
                            {Number(
                              (tx.amount || "0").toString().replace(/,/g, "")
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-3 px-6">{tx.formatted_created_at}</td>
                          <td
                            className={`py-3 px-6 uppercase font-bold text-center ${
                              tx.transaction_type === "credit"
                                ? "text-green-600"
                                : tx.transaction_type === "debit"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                                tx.transaction_type === "credit"
                                  ? "bg-green-100"
                                  : tx.transaction_type === "debit"
                                  ? "bg-red-100"
                                  : "bg-yellow-100"
                              }`}
                            >
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {tx.remarks || tx.refund_reason}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {pagination.total > 10 && (
                <div className="mt-6">
                  <BasicPagination
                    currentPage={pagination.current_page}
                    totalPages={pagination.last_page}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
