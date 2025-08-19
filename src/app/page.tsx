"use client";

import { useEffect, useState } from "react";
import { listContacts, addContact, deleteContact } from "quickwire/contact";
import { log, sayHello } from "quickwire/log";

interface Contact {
  name: string;
  email: string;
  phone: string | null;
  id: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const fetchContacts = async () => {
    const all = await listContacts();
    setContacts(all as Contact[]);
  };

  const handleAdd = async () => {
    if (!name || !email) return;
    await addContact({ name, email, phone: phone || undefined });
    setName("");
    setEmail("");
    setPhone("");
    fetchContacts();
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <div className="p-8">
      <button onClick={() => log({str: "Hi........"})}>Log</button>
      <button onClick={sayHello}>Say hello</button>
      <button onClick={fetchContacts}>reload</button>
      <h1 className="text-2xl font-bold mb-4">Contacts</h1>

      <div className="mb-4">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-1 mr-2"
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-1 mr-2"
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-1 mr-2"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-2 py-1"
        >
          Add
        </button>
      </div>

      <ul>
        {contacts.map((c) => (
          <li key={c.id} className="mb-2">
            <strong>{c.name}</strong> ({c.email}) {c.phone && `- ${c.phone}`}
            <button
              className="p-2 bg-amber-200"
              onClick={async () => {
                await deleteContact(c.id);
                fetchContacts();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
