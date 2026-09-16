const COMPLETED_NON_OVERLAPPING_MONTHS = 6;

export const getExperienceDuration = () => {
  const totalMonths = COMPLETED_NON_OVERLAPPING_MONTHS;
  const months = totalMonths % 12;

  return {
    totalMonths,
    label: `${totalMonths} mo${totalMonths === 1 ? '' : 's'} Internships`,
  };
};
