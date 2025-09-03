"use client";

import { useState, useEffect } from "react";
import { searchContacts, addContact, updateContact } from "quickwired/contact";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

interface SearchResult {
  contacts: Contact[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function SearchDemoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    phone: string;
  }>({ name: "", email: "", phone: "" });

  // Demo data for adding sample contacts
  const sampleContacts = [
    { name: "John Doe", email: "john.doe@example.com", phone: "+1-555-0123" },
    { name: "Jane Smith", email: "jane.smith@example.com", phone: "+1-555-0456" },
    { name: "Bob Johnson", email: "bob.johnson@example.com", phone: "+1-555-0789" },
    { name: "Alice Brown", email: "alice.brown@example.com", phone: "+1-555-0321" },
    { name: "Charlie Wilson", email: "charlie.wilson@example.com", phone: "+1-555-0654" },
  ];

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchContacts({
        query: query.trim(),
        limit: 10,
        offset: 0,
      });
      setSearchResults(results);
    } catch (err) {
      setError(`Search failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const addSampleContacts = async () => {
    setIsLoading(true);
    try {
      for (const contact of sampleContacts) {
        try {
          await addContact(contact);
        } catch (error) {
          // Skip duplicates or other errors
          console.log(`Skipped contact ${contact.name}:`, error);
        }
      }
      alert("Sample contacts added! Try searching now.");
    } catch (error) {
      setError(`Failed to add sample contacts: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreResults = async () => {
    if (!searchResults || !searchResults.hasMore || !searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const moreResults = await searchContacts({
        query: searchQuery.trim(),
        limit: 10,
        offset: searchResults.offset + searchResults.limit,
      });

      setSearchResults({
        ...moreResults,
        contacts: [...searchResults.contacts, ...moreResults.contacts],
      });
    } catch (err) {
      setError(`Failed to load more results: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setEditForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", email: "", phone: "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    try {
      await updateContact({
        id: editingId,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || undefined,
      });
      
      setEditingId(null);
      setEditForm({ name: "", email: "", phone: "" });
      
      // Refresh the search results
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    } catch (error) {
      setError(`Failed to update contact: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Quickwire Search Demo
          </h1>
          <p className="text-gray-600 mb-8">
            Search through contacts by name, email, or phone number using the generated searchable API.
          </p>

          {/* Add Sample Data Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              📦 Need Sample Data?
            </h2>
            <p className="text-blue-700 mb-3">
              Add some sample contacts to test the search functionality.
            </p>
            <button
              onClick={addSampleContacts}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Adding..." : "Add Sample Contacts"}
            </button>
          </div>

          {/* Search Section */}
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Contacts
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Type to search by name, email, or phone..."
                value={searchQuery}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {isLoading && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Results
              </h2>

              {searchResults ? (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    Found <span className="font-semibold">{searchResults.total}</span> contact(s) matching {searchQuery}
                    {searchResults.total > searchResults.contacts.length && (
                      <span> (showing {searchResults.contacts.length})</span>
                    )}
                  </div>

                  {searchResults.contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0120 12c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 2.027.754 3.887 2 5.291" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No contacts match your search criteria. Try a different search term.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 mb-4">
                        {searchResults.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              {editingId === contact.id ? (
                                // Edit mode
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={editForm.name}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Name"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                      type="email"
                                      value={editForm.email}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Email"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                      type="tel"
                                      value={editForm.phone}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Phone (optional)"
                                    />
                                  </div>
                                </div>
                              ) : (
                                // View mode
                                <div className="flex-1">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {contact.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">{contact.email}</p>
                                  {contact.phone && (
                                    <p className="text-sm text-gray-600">{contact.phone}</p>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex flex-col gap-2 ml-4">
                                {editingId === contact.id ? (
                                  // Edit mode buttons
                                  <>
                                    <button
                                      onClick={saveEdit}
                                      disabled={!editForm.name.trim() || !editForm.email.trim()}
                                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  // View mode buttons
                                  <>
                                    <button
                                      onClick={() => startEdit(contact)}
                                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                                    >
                                      Edit
                                    </button>
                                    <div className="text-xs text-gray-400">
                                      Added {new Date(contact.createdAt).toLocaleDateString()}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {searchResults.hasMore && (
                        <div className="text-center">
                          <button
                            onClick={loadMoreResults}
                            disabled={isLoading}
                            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {isLoading ? "Loading..." : "Load More Results"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                !isLoading && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Enter a search term to find contacts</p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🚀 How This Works
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Backend Function:</strong> `searchContacts()` in `/src/backend/contact.ts`</li>
              <li>• <strong>Auto-Generated API:</strong> `/api/contact/search-contacts` endpoint</li>
              <li>• <strong>Client Function:</strong> `searchContacts()` from `quickwired/contact`</li>
              <li>• <strong>Search Features:</strong> Case-insensitive search across name, email, and phone</li>
              <li>• <strong>Pagination:</strong> Supports limit/offset for large result sets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
