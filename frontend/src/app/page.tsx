"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

const API = "https://airbnb-clone-backend-610v.onrender.com";

type Listing = {
  id: number;
  title: string;
  description: string;
  location: string;
  price_per_night: number;
  rating: number;
  image_url: string;
  category: string;
  max_guests: number;
};

type Booking = {
  id: number;
  listing_id: number;
  listing_title: string;
  location: string;
  image_url: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
};

const categories = [
  ["🏠", "Homes"],
  ["🏖️", "Beach"],
  ["🏔️", "Mountains"],
  ["🏊", "Amazing pools"],
  ["🌳", "Countryside"],
  ["🏕️", "Camping"],
  ["🏛️", "Historical"],
  ["✨", "Trending"],
];

const emptyForm = {
  title: "",
  description: "",
  location: "",
  price_per_night: 3000,
  image_url:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
  category: "Homes",
  max_guests: 2,
};

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [view, setView] = useState<
    "home" | "trips" | "host"
  >("home");

  const [selected, setSelected] =
    useState<Listing | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Homes");

  const [guests, setGuests] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const [wishlist, setWishlist] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [hostForm, setHostForm] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  async function loadListings() {
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/listings`
      );

      const data = await response.json();

      setListings(data);
    } catch {
      setMessage(
        "Backend is not running. Start FastAPI on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadBookings() {
    try {
      const response = await fetch(
        `${API}/api/bookings`
      );

      setBookings(await response.json());
    } catch {
      // Keep frontend usable.
    }
  }

  useEffect(() => {
    loadListings();
    loadBookings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const text =
        `${listing.title} ${listing.location} ${listing.description}`.toLowerCase();

      const matchesSearch =
        !search ||
        text.includes(search.toLowerCase());

      let matchesCategory = true;

      if (
        category !== "Homes" &&
        category !== "Amazing pools" &&
        category !== "Trending"
      ) {
        matchesCategory =
          listing.category === category;
      }

      if (category === "Trending") {
        matchesCategory =
          listing.rating >= 4.85;
      }

      return matchesSearch && matchesCategory;
    });
  }, [listings, search, category]);

  function openListing(listing: Listing) {
    setSelected(listing);
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
    setMessage("");
  }

  async function reserve() {
    if (!selected) return;

    if (!checkIn || !checkOut) {
      setMessage(
        "Please choose check-in and check-out dates."
      );
      return;
    }

    if (
      new Date(checkIn) >=
      new Date(checkOut)
    ) {
      setMessage(
        "Check-out must be after check-in."
      );
      return;
    }

    if (guests > selected.max_guests) {
      setMessage(
        `Maximum ${selected.max_guests} guests for this stay.`
      );
      return;
    }

    setBookingLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listing_id: selected.id,
            guest_name: "Demo Guest",
            check_in: checkIn,
            check_out: checkOut,
            guests,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Booking failed"
        );
      }

      await loadBookings();

      setMessage(
        `Booking confirmed! Total: ${money(
          data.total_price
        )}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Booking failed"
      );
    } finally {
      setBookingLoading(false);
    }
  }

  async function saveHostListing(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      const method = editingId ? "PUT" : "POST";

      const url = editingId
        ? `${API}/api/listings/${editingId}`
        : `${API}/api/listings`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hostForm),
      });

      if (!response.ok) {
        throw new Error(
          "Could not save listing"
        );
      }

      setHostForm(emptyForm);
      setEditingId(null);

      await loadListings();

      setMessage(
        editingId
          ? "Listing updated successfully."
          : "Listing created successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save listing"
      );
    }
  }

  async function deleteListing(id: number) {
    if (!confirm("Delete this listing?")) {
      return;
    }

    await fetch(
      `${API}/api/listings/${id}`,
      {
        method: "DELETE",
      }
    );

    await loadListings();

    setMessage("Listing deleted.");
  }

  function editListing(listing: Listing) {
    setEditingId(listing.id);

    setHostForm({
      title: listing.title,
      description: listing.description,
      location: listing.location,
      price_per_night:
        listing.price_per_night,
      image_url: listing.image_url,
      category: listing.category,
      max_guests: listing.max_guests,
    });

    setView("host");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const nights =
    selected &&
    checkIn &&
    checkOut
      ? Math.max(
          0,
          Math.ceil(
            (new Date(checkOut).getTime() -
              new Date(checkIn).getTime()) /
              86400000
          )
        )
      : 0;

  const subtotal = selected
    ? nights * selected.price_per_night
    : 0;

  const serviceFee =
    Math.round(subtotal * 0.12);

  const total = subtotal + serviceFee;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button
            onClick={() => {
              setView("home");
              setSelected(null);
            }}
            className="text-3xl font-bold text-rose-500"
          >
            airbnb
          </button>

          <nav className="hidden gap-8 md:flex">
            <button
              onClick={() => {
                setView("home");
                setSelected(null);
              }}
              className={
                view === "home"
                  ? "font-semibold"
                  : "text-gray-500"
              }
            >
              Stays
            </button>

            <button
              onClick={() =>
                setMessage(
                  "Experiences are represented as a simplified demo section."
                )
              }
              className="text-gray-500"
            >
              Experiences
            </button>

            <button
              onClick={() => {
                setView("host");
                setSelected(null);
              }}
              className={
                view === "host"
                  ? "font-semibold"
                  : "text-gray-500"
              }
            >
              Airbnb your home
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setView("trips");
                setSelected(null);
              }}
              className="rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              My Trips
            </button>

            <button className="rounded-full border px-4 py-2">
              ☰ 👤
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-5 pb-4">
          <div className="flex flex-col overflow-hidden rounded-full border shadow-sm md:flex-row">
            <div className="flex-1 px-5 py-3">
              <label className="block text-xs font-bold">
                Where
              </label>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search destinations"
                className="w-full bg-transparent outline-none"
              />
            </div>

            <div className="flex-1 border-t px-5 py-3 md:border-l md:border-t-0">
              <label className="block text-xs font-bold">
                Check in
              </label>

              <input
                type="date"
                min={today()}
                value={checkIn}
                onChange={(e) =>
                  setCheckIn(e.target.value)
                }
                className="w-full bg-transparent outline-none"
              />
            </div>

            <div className="flex-1 border-t px-5 py-3 md:border-l md:border-t-0">
              <label className="block text-xs font-bold">
                Check out
              </label>

              <input
                type="date"
                min={checkIn || today()}
                value={checkOut}
                onChange={(e) =>
                  setCheckOut(e.target.value)
                }
                className="w-full bg-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-3 border-t px-5 py-3 md:border-l md:border-t-0">
              <div>
                <label className="block text-xs font-bold">
                  Guests
                </label>

                <span className="text-sm text-gray-600">
                  {guests}
                </span>
              </div>

              <button
                onClick={() =>
                  setGuests(
                    Math.min(10, guests + 1)
                  )
                }
                className="rounded-full bg-rose-500 px-4 py-2 font-bold text-white"
              >
                🔎
              </button>
            </div>
          </div>
        </div>
      </header>

      {message && (
        <div className="mx-auto mt-4 max-w-7xl px-5">
          <div className="rounded-xl bg-gray-900 px-4 py-3 text-sm text-white">
            {message}
          </div>
        </div>
      )}

      {view === "home" && !selected && (
        <>
          <div className="mx-auto max-w-7xl overflow-x-auto px-5 py-5">
            <div className="flex min-w-max gap-7">
              {categories.map(
                ([icon, name]) => (
                  <button
                    key={name}
                    onClick={() =>
                      setCategory(name)
                    }
                    className={`flex w-24 flex-col items-center gap-2 border-b-2 pb-3 text-sm ${
                      category === name
                        ? "border-gray-900 font-bold"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    <span className="text-2xl">
                      {icon}
                    </span>

                    {name}
                  </button>
                )
              )}
            </div>
          </div>

          <section className="mx-auto max-w-7xl px-5 pb-12">
            <div className="mb-5 flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                Explore stays around the world
              </h1>

              <span className="rounded-full border px-4 py-2 text-sm">
                ⚙ Filters
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-500">
                Loading stays...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {filteredListings.map(
                  (listing) => (
                    <article
                      key={listing.id}
                      onClick={() =>
                        openListing(listing)
                      }
                      className="cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-2xl">
                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="h-64 w-full object-cover transition hover:scale-105"
                        />

                        <button
                          onClick={(event) => {
                            event.stopPropagation();

                            setWishlist(
                              (current) =>
                                current.includes(
                                  listing.id
                                )
                                  ? current.filter(
                                      (id) =>
                                        id !==
                                        listing.id
                                    )
                                  : [
                                      ...current,
                                      listing.id,
                                    ]
                            );
                          }}
                          className="absolute right-3 top-3 text-3xl text-white drop-shadow"
                        >
                          {wishlist.includes(
                            listing.id
                          )
                            ? "♥"
                            : "♡"}
                        </button>
                      </div>

                      <div className="mt-2 flex justify-between gap-2">
                        <div>
                          <h2 className="font-semibold">
                            {listing.location}
                          </h2>

                          <p className="text-sm text-gray-500">
                            {listing.title}
                          </p>

                          <p className="mt-1">
                            <b>
                              {money(
                                listing.price_per_night
                              )}
                            </b>{" "}
                            night
                          </p>
                        </div>

                        <span>
                          ★{" "}
                          {listing.rating.toFixed(2)}
                        </span>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}

            {!loading &&
              filteredListings.length ===
                0 && (
                <div className="rounded-2xl bg-gray-50 p-12 text-center">
                  No stays match your search.
                </div>
              )}
          </section>
        </>
      )}

      {view === "home" && selected && (
        <section className="mx-auto max-w-6xl px-5 py-8">
          <button
            onClick={() =>
              setSelected(null)
            }
            className="mb-6 font-semibold underline"
          >
            ← Back to stays
          </button>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
                <img
                  src={selected.image_url}
                  className="col-span-2 h-80 w-full object-cover"
                  alt=""
                />

                <img
                  src={selected.image_url}
                  className="h-48 w-full object-cover"
                  alt=""
                />

                <img
                  src={selected.image_url}
                  className="h-48 w-full object-cover"
                  alt=""
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                {selected.category}
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                {selected.title}
              </h1>

              <p className="mt-2">
                📍 {selected.location} · ★{" "}
                {selected.rating.toFixed(2)} · up to{" "}
                {selected.max_guests} guests
              </p>

              <p className="mt-5 leading-7 text-gray-600">
                {selected.description}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  🛏️ Comfortable bedrooms
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  📶 Wi-Fi included
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  🍳 Kitchen
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  🚗 Free parking
                </div>
              </div>

              <div className="mt-6 rounded-2xl border p-5 shadow-sm">
                <div className="flex justify-between">
                  <span>
                    <b className="text-xl">
                      {money(
                        selected.price_per_night
                      )}
                    </b>{" "}
                    / night
                  </span>

                  <span>
                    ★ {selected.rating}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Check-in

                    <input
                      type="date"
                      min={today()}
                      value={checkIn}
                      onChange={(e) =>
                        setCheckIn(
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-lg border p-2"
                    />
                  </label>

                  <label className="text-sm font-semibold">
                    Check-out

                    <input
                      type="date"
                      min={
                        checkIn || today()
                      }
                      value={checkOut}
                      onChange={(e) =>
                        setCheckOut(
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-lg border p-2"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-sm font-semibold">
                  Guests

                  <input
                    type="number"
                    min="1"
                    max={
                      selected.max_guests
                    }
                    value={guests}
                    onChange={(e) =>
                      setGuests(
                        Number(e.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                  />
                </label>

                {nights > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {money(
                          selected.price_per_night
                        )}{" "}
                        × {nights} nights
                      </span>

                      <span>
                        {money(subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>
                        Service fee
                      </span>

                      <span>
                        {money(serviceFee)}
                      </span>
                    </div>

                    <div className="flex justify-between border-t pt-3 text-lg font-bold">
                      <span>Total</span>

                      <span>
                        {money(total)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  disabled={bookingLoading}
                  onClick={reserve}
                  className="mt-4 w-full rounded-xl bg-rose-500 py-3 font-bold text-white disabled:opacity-50"
                >
                  {bookingLoading
                    ? "Processing..."
                    : "Reserve · Demo checkout"}
                </button>
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm">
                <b>Guest reviews</b>

                <p className="mt-2">
                  “Beautiful place, great
                  location and comfortable
                  stay.”
                </p>

                <p className="mt-2">
                  “Exactly as described.
                  Would definitely return!”
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "trips" && (
        <section className="mx-auto max-w-6xl px-5 py-10">
          <h1 className="text-3xl font-bold">
            My Trips
          </h1>

          <p className="mt-2 text-gray-500">
            Your confirmed bookings are stored
            in SQLite.
          </p>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {bookings.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 p-10">
                No trips yet. Reserve a stay to
                see it here.
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border"
                >
                  <img
                    src={booking.image_url}
                    className="h-48 w-full object-cover"
                    alt=""
                  />

                  <div className="p-5">
                    <h2 className="text-xl font-bold">
                      {booking.listing_title}
                    </h2>

                    <p className="text-gray-500">
                      {booking.location}
                    </p>

                    <p className="mt-3">
                      📅 {booking.check_in} →{" "}
                      {booking.check_out}
                    </p>

                    <p>
                      👥 {booking.guests} guests
                    </p>

                    <p className="mt-3 font-bold">
                      {money(
                        booking.total_price
                      )}{" "}
                      · {booking.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {view === "host" && (
        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
            <div className="rounded-2xl border p-5 shadow-sm">
              <h1 className="text-2xl font-bold">
                {editingId
                  ? "Edit listing"
                  : "Create a listing"}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Host dashboard · changes persist
                to SQLite.
              </p>

              <form
                onSubmit={saveHostListing}
                className="mt-5 space-y-3"
              >
                <label className="block text-sm font-semibold">
                  Title

                  <input
                    required
                    value={hostForm.title}
                    onChange={(e) =>
                      setHostForm({
                        ...hostForm,
                        title: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Description

                  <textarea
                    required
                    value={
                      hostForm.description
                    }
                    onChange={(e) =>
                      setHostForm({
                        ...hostForm,
                        description:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                    rows={4}
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Location

                  <input
                    required
                    value={hostForm.location}
                    onChange={(e) =>
                      setHostForm({
                        ...hostForm,
                        location:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Image URL

                  <input
                    required
                    value={
                      hostForm.image_url
                    }
                    onChange={(e) =>
                      setHostForm({
                        ...hostForm,
                        image_url:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Price per night

                  <input
                    type="number"
                    min="1"
                    value={
                      hostForm.price_per_night
                    }
                    onChange={(e) =>
                      setHostForm({
                        ...hostForm,
                        price_per_night:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Maximum guests

                  <input
                    type="number"
                    min="1"
                    value={
                      hostForm.max_guests
                    }
                    onChange={(e) =>
                      setHostForm({
                        ...hostForm,
                        max_guests:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Category

                  <select
                    value={
                      hostForm.category
                    }
                    onChange={(e) =>
                      setHostForm({
                        ...hostForm,
                        category:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border p-2"
                  >
                    {categories
                      .slice(0, 7)
                      .map(([, name]) => (
                        <option
                          key={name}
                          value={name}
                        >
                          {name}
                        </option>
                      ))}
                  </select>
                </label>

                <button className="w-full rounded-xl bg-gray-900 py-3 font-bold text-white">
                  {editingId
                    ? "Update listing"
                    : "Publish listing"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setHostForm(
                        emptyForm
                      );
                    }}
                    className="w-full rounded-xl border py-3"
                  >
                    Cancel edit
                  </button>
                )}
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Your listings
              </h2>

              <div className="mt-5 space-y-4">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row"
                  >
                    <img
                      src={
                        listing.image_url
                      }
                      className="h-32 w-full rounded-xl object-cover sm:w-44"
                      alt=""
                    />

                    <div className="flex-1">
                      <h3 className="font-bold">
                        {listing.title}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {listing.location} ·{" "}
                        {money(
                          listing.price_per_night
                        )}{" "}
                        / night
                      </p>

                      <p className="mt-2 text-sm">
                        ★{" "}
                        {listing.rating} · up
                        to{" "}
                        {listing.max_guests}{" "}
                        guests
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() =>
                            editListing(
                              listing
                            )
                          }
                          className="rounded-lg border px-3 py-1"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteListing(
                              listing.id
                            )
                          }
                          className="rounded-lg border px-3 py-1 text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl bg-gray-50 p-5">
                <b>Host bookings</b>

                <p className="mt-2 text-sm text-gray-600">
                  {bookings.length} booking(s)
                  currently recorded.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-12 border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-5 py-8 text-sm text-gray-500">
          <b className="text-gray-900">
            Airbnb Clone
          </b>{" "}
          · SDE Fullstack Assignment · Next.js +
          FastAPI + SQLite · Mock payments and
          simplified authentication.
        </div>
      </footer>
    </main>
  );
}