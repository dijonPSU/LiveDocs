export const getColorForUser = (userId) => {
  const colors = ["#fa3", "#39f", "#2e2", "#f39", "#c83"];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
