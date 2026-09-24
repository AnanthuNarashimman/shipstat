import type { People } from "./npm";

export type Maker = {
  name: string; // what to call them: the package.json author, else the GitHub owner, else an npm maintainer
  url: string | null; // their own site, if the author field has one
  github: string | null; // GitHub user or organisation that owns the repository
  avatar: string | null; // public GitHub avatar, no email involved
};

// Who gets the credit for a package, or null when npm tells us nothing about them.
export function makerOf(people: People): Maker | null {
  const name = people.author?.name ?? people.github ?? people.maintainers[0];
  if (!name) return null;
  return {
    name,
    url: people.author?.url ?? null,
    github: people.github,
    avatar: people.github ? `https://github.com/${people.github}.png?size=96` : null,
  };
}

export const npmProfile = (username: string) => `https://www.npmjs.com/~${encodeURIComponent(username)}`;
export const githubProfile = (login: string) => `https://github.com/${encodeURIComponent(login)}`;
