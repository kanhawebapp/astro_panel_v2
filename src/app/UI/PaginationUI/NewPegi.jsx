const BasicPagination2 = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
  
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  
    return (
      <div className="flex gap-2 mt-4">
        {pages.map((page) => (
          <button
            key={page}
            className={`px-3 py-1 rounded ${currentPage === page ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
    );
  };
  