"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const getDriveImageUrl = (url) => {
  if (!url?.includes("drive.google.com")) return url;
  const match = url.match(/(?:\/d\/|id=)([^/?]+)/);
  return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen p-6 bg-black text-white">
      <h1 className="text-3xl font-bold text-center mb-6">📅 Upcoming Events</h1>

      {loading ? (
        <p className="text-center text-gray-400">Loading events...</p>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <motion.div
              key={event._id}
              className="p-6 bg-gray-900 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative w-full h-52">
                {event.image ? (
                  <img
                    src={getDriveImageUrl(event.image)}
                    alt="Event Poster"
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                    🖼 No Image Available
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold mt-4">{event.title || "Untitled Event"}</h2>
              <p className="text-gray-300 text-sm mt-2">{event.description || "No description available."}</p>

              {event.date && (
                <p className="text-sm text-gray-400 mt-2">
                  📅 {new Date(event.date).toDateString()}
                </p>
              )}

              <div className="mt-4 space-y-2">
                {event.rulebook && (
                  <a
                    href={event.rulebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-400 hover:text-blue-300 underline"
                  >
                    📄 View Rulebook
                  </a>
                )}
                {event.registerLink && (
                  <a
                    href={event.registerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-green-400 hover:text-green-300 underline"
                  >
                    📝 Register Now
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">No upcoming events.</p>
      )}
    </div>
  );
}