"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "254710655709";

export default function MoveMateQuoteForm() {
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const items = String(formData.get("items") ?? "").trim();
    const pickup = String(formData.get("pickup") ?? "").trim();
    const destination = String(formData.get("destination") ?? "").trim();
    const pickupFloor = String(formData.get("pickupFloor") ?? "").trim();
    const destinationFloor = String(formData.get("destinationFloor") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim() || "Not set yet";

    if (!items || !pickup || !destination || !pickupFloor || !destinationFloor) {
      setError("Please fill in the items, route, and both floor details.");
      return;
    }

    const message = [
      "Hello MoveMate Movers. Please give me a moving quote.",
      "",
      `Items/load: ${items}`,
      `Moving from: ${pickup}`,
      `Pickup floor/access: ${pickupFloor}`,
      `Moving to: ${destination}`,
      `Destination floor/access: ${destinationFloor}`,
      `Preferred date: ${date}`,
      "I understand the final price is confirmed by MoveMate Movers and depends on the move details.",
    ].join("\n");

    window.location.assign(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    );
  }

  const fieldClassName =
    "mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="movemate-items" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          What needs moving?
        </label>
        <textarea
          id="movemate-items"
          name="items"
          required
          maxLength={500}
          rows={3}
          placeholder="List the items and approximate quantity, for example: bed, mattress, desk and 6 boxes"
          className={fieldClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="movemate-pickup" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Pickup area or address
          </label>
          <input
            id="movemate-pickup"
            name="pickup"
            required
            maxLength={160}
            autoComplete="street-address"
            placeholder="e.g. Makutano, Meru"
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="movemate-destination" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Delivery area or address
          </label>
          <input
            id="movemate-destination"
            name="destination"
            required
            maxLength={160}
            placeholder="e.g. Kaaga, Meru"
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="movemate-pickup-floor" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Floor at pickup
          </label>
          <input
            id="movemate-pickup-floor"
            name="pickupFloor"
            required
            maxLength={100}
            placeholder="e.g. 2nd floor, stairs / lift"
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="movemate-destination-floor" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Floor at destination
          </label>
          <input
            id="movemate-destination-floor"
            name="destinationFloor"
            required
            maxLength={100}
            placeholder="e.g. ground floor, stairs / lift"
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="movemate-date" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Preferred moving date <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input id="movemate-date" name="date" type="date" className={fieldClassName} />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      >
        <MessageCircle aria-hidden="true" className="h-5 w-5" />
        Continue to WhatsApp
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        Your details stay in this browser until you continue. The button opens WhatsApp with a message you can review
        before sending; nothing is submitted to KhejaLink.
      </p>
    </form>
  );
}
