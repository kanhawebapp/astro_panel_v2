"use client";
import { useGetdosAndDontApiQuery } from "@/app/redux/slice/doesDont";

export default function DosAndDontsPage() {
  const { data, isLoading, error } = useGetdosAndDontApiQuery();

  if (isLoading) return <p>Loading data...</p>;
  if (error) return <p className="text-red-500">Failed to load data.</p>;

  return (
    <div className="p-6 ">
      <div className="text-2xl font-bold mb-4 justify-self-center wallet-head">Do's and Don'ts</div>
      <div
        className="mb-6 bg-gray-100 p-4 rounded-xl "
        dangerouslySetInnerHTML={{ __html: data?.dos }}
      />
      <hr />
      <div
        className="mt-6 bg-gray-100 p-4 rounded-xl "
        dangerouslySetInnerHTML={{ __html: data?.dont }}
      />
    </div>
  );
}
