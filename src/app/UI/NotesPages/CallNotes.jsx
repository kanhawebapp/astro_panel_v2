"use client";
import { useGetnotesApiQuery, useAddNoteApiMutation } from "@/app/redux/slice/notesApi";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";


const CallNotes = ({ orderId }) => {
  const [addNoteApi, { isLoading: isSubmitting }] = useAddNoteApiMutation();
    const { data, isLoading, error, refetch } = useGetnotesApiQuery(orderId);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async () => {
      if (!title.trim() || !description.trim()) {
        toast.error("Title and Description are required");
        return;
      }
    
      try {
        const payload = {
          request_session_id: orderId,
          title,
          description,
        };
    
        const response = await addNoteApi(payload).unwrap(); 
    
        toast.success("Note submitted successfully");
        setShowModal(false);
        setTitle("");
        setDescription("");
        refetch(); 
      } catch (error) {
        console.error("Submission error:", error);
        toast.error(error?.data?.error || "Submission failed");
      }
    };
  

  return (
    <div className="p-4 h-screen">

       <div className=" wave flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold ">Call Notes </h2>
      <button onClick={() => setShowModal(true)} className="bg-black p-2 rounded-full text-white cursor-pointer">
      <Plus />

        </button>
       </div>
      {data?.data?.length ? (
        <div className="gap-5 grid grid-cols-2 md:grid-cols-3">
        {data.data.map((note) => (
            <div key={note.id} className="p-4 w-[20rem]   bg-gray-200 rounded-xl shadow">
              <div>
              <span className="text-sm font-semibold">Title:</span>
              <span className="text-sm"> {note.title}</span>
              </div>
              <hr className="p-1 "/>
              <div>
              <span className="text-sm font-semibold">Description:</span>
              <p className="text-sm text-gray-800 mb-2">{note.description}</p>
              </div>
              
              <p className="text-sm text-gray-500">
                Date: {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>No notes available.</p>
      )}

{showModal && (
        <div className="fixed inset-0 bg-[#0000009c] bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded w-[90%] max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Add Note</h3>
            <input
              className="w-full border p-2 rounded mb-3"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full border p-2 rounded mb-4"
              rows={4}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTitle("");
                  setDescription("");
                }}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallNotes;
