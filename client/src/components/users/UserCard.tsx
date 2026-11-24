import { memo } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { User } from '../../types';
import { Avatar } from './Avatar';
import { HobbyChips } from './HobbyChips';

interface UserCardProps {
  user: User;
  selectedHobbies: string[];
  selectedNationalities: string[];
  onToggleHobby: (hobby: string) => void;
  onToggleNationality: (nationality: string) => void;
}

/**
 * |----------------------------------|
 * | avatar      first_name+last_name |
 * |             nationality      age |
 * |                                  |
 * |             (2 hobbies) (+n)     |
 * |----------------------------------|
 */
function UserCardView({ user, selectedHobbies, selectedNationalities, onToggleHobby, onToggleNationality }: UserCardProps) {
  const name = `${user.first_name} ${user.last_name}`;
  const nationalityOn = selectedNationalities.includes(user.nationality);

  return (
    <article className="profile-card" aria-label={name}>
      <div className="flex items-start gap-3.5">
        <Avatar src={user.avatar} firstName={user.first_name} lastName={user.last_name} />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold" title={name}>
            {name}
          </h3>
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => onToggleNationality(user.nationality)}
              title={`Filter by nationality: ${user.nationality}`}
              className={`flex min-w-0 cursor-pointer items-center gap-1 text-left transition-colors hover:text-blue-600 ${
                nationalityOn ? 'font-semibold text-blue-600' : ''
              }`}
            >
              <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              <span className="truncate">{user.nationality}</span>
            </button>
            <span className="flex shrink-0 items-center gap-1 font-medium">
              <Calendar className="size-3 text-slate-400" aria-hidden />
              {user.age} yrs
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-h-7.5 flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
        <HobbyChips hobbies={user.hobbies} selected={selectedHobbies} onToggle={onToggleHobby} />
      </div>
    </article>
  );
}

/** Memoised: cards only re-render when their user or the selected filters change. */
export const UserCard = memo(UserCardView);
