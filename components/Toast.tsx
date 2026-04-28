"use client";

import React, { useEffect, useState } from "react";
import { IconCheck } from "@tabler/icons-react";

export default function Toast({ show, message }: { show: boolean; message: string }) {
  const [render, setRender] = useState(show);

  useEffect(() => {
    if (show) setRender(true);
  }, [show]);

  const handleAnimationEnd = () => {
    if (!show) setRender(false);
  };

  if (!render) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 flex max-w-sm -translate-x-1/2 transform rounded-full bg-neutral-900 px-6 py-3 font-medium text-white shadow-xl transition-all duration-300 ease-out ${
        show ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
      }`}
      onTransitionEnd={handleAnimationEnd}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
          <IconCheck size={16} stroke={3} className="text-neutral-900" />
        </div>
        <span>{message}</span>
      </div>
    </div>
  );
}
