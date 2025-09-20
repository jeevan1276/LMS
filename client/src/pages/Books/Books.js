import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBooks } from '../../store/slices/bookSlice';

const Books = () => {
  const dispatch = useDispatch();
  const { books, isLoading, pagination } = useSelector((state) => state.books);

  useEffect(() => {
    dispatch(fetchBooks());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Books</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse and search through our collection of books.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books?.map((book) => (
          <div key={book._id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="aspect-w-3 aspect-h-4 mb-4">
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {book.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
            <p className="text-xs text-gray-500 mb-3">{book.genre}</p>
            <div className="flex items-center justify-between">
              <span className={`badge ${
                book.availableCopies > 0 ? 'badge-success' : 'badge-danger'
              }`}>
                {book.availableCopies > 0 ? 'Available' : 'Unavailable'}
              </span>
              <span className="text-xs text-gray-500">
                {book.availableCopies}/{book.totalCopies} copies
              </span>
            </div>
          </div>
        ))}
      </div>

      {books?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No books found.</p>
        </div>
      )}
    </div>
  );
};

export default Books;
