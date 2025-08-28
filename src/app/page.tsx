"use client";

import { useEffect, useState, useCallback } from "react";
import { listContacts, addContact, deleteContact, updateContact, searchContacts } from "quickwired/contact";
import { log } from "quickwired/log";

interface Contact {
  name: string;
  email: string;
  phone: string | null;
  id: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SearchResult {
  contacts: Contact[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    phone: string;
  }>({ name: "", email: "", phone: "" });

  const fetchContacts = async () => {
    const all = await listContacts();
    setContacts(all as Contact[]);
    setSearchResults(null);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchContacts({ query, limit: 20 });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to client-side filtering if API fails
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        contact.email.toLowerCase().includes(query.toLowerCase()) ||
        (contact.phone && contact.phone.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults({
        contacts: filtered,
        total: filtered.length,
        limit: 20,
        offset: 0,
        hasMore: false
      });
    } finally {
      setIsSearching(false);
    }
  }, [contacts]);

  const handleAdd = async () => {
    if (!name || !email) return;
    await addContact({ name, email, phone: phone || undefined });
    setName("");
    setEmail("");
    setPhone("");
    fetchContacts();
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
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
      fetchContacts();
      
      // Also refresh search results if we're currently searching
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
      alert('Failed to update contact. Please try again.');
    }
  };

  const displayContacts = searchResults ? searchResults.contacts : contacts;

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div className="p-8">
      <button onClick={() => log({str: "Hi........"})}>Log</button>
      <button onClick={fetchContacts}>reload</button>
      <h1 className="text-2xl font-bold mb-4">Contacts</h1>

      {/* Search Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Search Contacts</h2>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isSearching && (
            <span className="text-gray-500 text-sm">Searching...</span>
          )}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults(null);
              }}
              className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
            >
              Clear
            </button>
          )}
        </div>
        {searchResults && (
          <div className="text-sm text-gray-600 mb-2">
            Found {searchResults.total} contact(s)
            {searchResults.hasMore && " (showing first 20)"}
          </div>
        )}
      </div>

      {/* Add Contact Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Add New Contact</h2>
        <div className="flex gap-2 mb-4">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!name || !email}
          >
            Add Contact
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          {searchQuery ? `Search Results (${displayContacts.length})` : `All Contacts (${displayContacts.length})`}
        </h2>
        {displayContacts.length === 0 ? (
          <p className="text-gray-500">
            {searchQuery ? "No contacts found matching your search." : "No contacts yet. Add some contacts to get started."}
          </p>
        ) : (
          <ul className="space-y-2">
            {displayContacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                {editingId === c.id ? (
                  // Edit mode
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name"
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email"
                    />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone (optional)"
                    />
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm text-gray-600">{c.email}</div>
                    {c.phone && <div className="text-sm text-gray-600">{c.phone}</div>}
                  </div>
                )}
                
                <div className="flex gap-2 ml-4">
                  {editingId === c.id ? (
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
                        onClick={() => startEdit(c)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${c.name}?`)) {
                            await deleteContact(c.id);
                            fetchContacts();
                            // Also refresh search results if we're currently searching
                            if (searchQuery) {
                              handleSearch(searchQuery);
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
