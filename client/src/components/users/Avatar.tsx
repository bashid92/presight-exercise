import { useState } from 'react';

interface AvatarProps {
  src: string;
  firstName: string;
  lastName: string;
}

/** Profile photo; falls back to initials when the image cannot load (e.g. offline). */
export function Avatar({ src, firstName, lastName }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-xs"
      >
        {firstName.charAt(0)}
        {lastName.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`${firstName} ${lastName}`}
      width={64}
      height={64}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="size-16 shrink-0 rounded-xl border border-slate-200/80 bg-slate-100 object-cover shadow-xs"
    />
  );
}
