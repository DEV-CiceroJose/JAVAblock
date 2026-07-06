export function sortRanking(groups) {
  return [...groups].sort((a, b) => b.xp - a.xp);
}
export async function getRanking(repo) {
  return sortRanking(await repo.listGroups());
}
