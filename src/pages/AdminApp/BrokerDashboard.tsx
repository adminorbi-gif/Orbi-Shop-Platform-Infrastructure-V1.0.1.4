import React, { useState, useEffect } from "react";
import { Broker } from "../../types";

export const BrokerDashboard: React.FC = () => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [commissionRate, setCommissionRate] = useState("");

  const fetchBrokers = () => {
    fetch("/api/brokers")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((json) => {
            throw new Error(json.error || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setBrokers(data);
          setError(null);
        } else if (data && typeof data === "object" && "error" in data) {
          setError(String((data as any).error));
          setBrokers([]);
        } else {
          setBrokers([]);
          setError("Invalid response format received from server.");
        }
      })
      .catch((err) => {
        setError(err.message);
        setBrokers([]);
      });
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const updateBrokerStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/brokers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || `HTTP error! status: ${res.status}`);
      }
      setBrokers((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: status as any } : b))
      );
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const addBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, commissionRate: parseFloat(commissionRate) }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || `HTTP error! status: ${res.status}`);
      }
      setName("");
      setPhone("");
      setEmail("");
      setCommissionRate("");
      fetchBrokers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Broker Management System</h1>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
            <span>Error: {error}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setError(null)} 
            className="text-rose-500 hover:text-rose-700 font-bold transition px-2 py-1 hover:bg-rose-100 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={addBroker} className="mb-6 p-4 bg-gray-50 rounded-md">

        <h2 className="text-lg font-semibold mb-2">Add New Broker</h2>
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="p-2 border rounded" required />
          <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-2 border rounded" required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-2 border rounded" required />
          <input type="number" placeholder="Commission Rate (%)" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="p-2 border rounded" required />
        </div>
        <button type="submit" className="mt-2 bg-primary text-white px-4 py-2 rounded">Add Broker</button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(brokers) && brokers.map((broker) => (
              <tr key={broker.id}>
                <td className="px-6 py-4 whitespace-nowrap">{broker.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{broker.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{broker.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    broker.status === 'verified' ? 'bg-green-100 text-green-800' :
                    broker.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {broker.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={broker.status}
                    onChange={(e) => updateBrokerStatus(broker.id, e.target.value)}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
