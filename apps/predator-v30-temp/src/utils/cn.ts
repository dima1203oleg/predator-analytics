export function cn(...classes: (string | undefined | null | false)[]) {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}
