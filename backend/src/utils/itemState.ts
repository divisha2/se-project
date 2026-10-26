// Lock + status rules for a Course File item (SRS 3.1, FR-FAC-20..24, SRS 3.4 statuses).

export type DisplayStatus = 'PENDING' | 'SUBMITTED' | 'INVALID' | 'LOCKED';

interface LockFields {
  isLocked: boolean;
  deadline: Date | null;
  reopenedUntil: Date | null;
}

// An item is locked when its deadline has passed, unless the coordinator has
// reopened it and the reopen window is still running.
export const isItemLocked = (item: LockFields, now = new Date()): boolean => {
  if (item.reopenedUntil && item.reopenedUntil > now) return false;
  if (item.isLocked) return true;
  return !!item.deadline && item.deadline <= now;
};

interface CurrentSubmissionLike {
  validationStatus: 'NOT_CHECKED' | 'VALID' | 'INVALID' | 'NEEDS_REVIEW';
}

export const displayStatus = (
  item: LockFields,
  current: CurrentSubmissionLike | null | undefined,
  now = new Date(),
): DisplayStatus => {
  if (isItemLocked(item, now)) return 'LOCKED';
  if (!current) return 'PENDING';
  if (current.validationStatus === 'INVALID') return 'INVALID';
  return 'SUBMITTED';
};

// A mandatory item counts as complete only when something has been submitted
// and it is not invalid and has finished its relevance check.
export const isComplete = (current: CurrentSubmissionLike | null | undefined): boolean =>
  !!current && (current.validationStatus === 'VALID' || current.validationStatus === 'NEEDS_REVIEW');
