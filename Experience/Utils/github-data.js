/**
 * GitHub activity feed + repo cards module — renders a live feed of recent
 * GitHub activity (commits, PRs, releases, etc.) and a grid of pinned/public
 * repos pulled from the GitHub REST API.
 *
 * All data is cached on sessionStorage (30 min TTL) so scrolling back up doesn't
 * re-fire network requests on every pass.
 */

const GH_USER = "menoc61";
const CACHE_KEY = "portfolio-github-v1";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

async function cachedFetch(key, fn) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* stale/corrupt → refetch */ }
  const data = await fn();
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* storage full */ }
  return data;
}

async function ghJson(url, extraHeaders = {}) {
  const token = window.__GITHUB_TOKEN__ || "";
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

/** Fetch profile + recent public repos (non-fork, sorted by updated). */
export async function loadGithubData() {
  return cachedFetch(CACHE_KEY, async () => {
    const [profile, repos] = await Promise.all([
      ghJson(`https://api.github.com/users/${GH_USER}`),
      ghJson(`https://api.github.com/users/${GH_USER}/repos?per_page=30&sort=updated&type=all`),
    ]);

    const pinnedIds = new Set(
      (profile.pinned_repo_ids || []).map(String)
    );

    const reposMapped = repos
      .filter(r => !r.fork)
      .map(r => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description || null,
        url: r.html_url,
        homepage: r.homepage || null,
        language: r.language || null,
        languageColor: languageColorFor(r.language),
        forkCount: r.forks_count,
        starCount: r.stargazers_count,
        issueCount: r.open_issues_count,
        updatedAt: r.updated_at,
        createdAt: r.created_at,
        isPinned: pinnedIds.has(String(r.id)),
        defaultBranch: r.default_branch,
        topics: r.topics || [],
        visibility: r.visibility,
      }))
      .sort((a, b) => {
        // Pinned repos first, then by update date
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

    return {
      profile: {
        login: profile.login,
        name: profile.name || profile.login,
        avatarUrl: profile.avatar_url,
        bio: profile.bio || null,
        company: profile.company || null,
        location: profile.location || null,
        blog: profile.blog || null,
        twitterUsername: profile.twitter_username || null,
        linkedin: extractLinkedIn(profile.bio || "", profile.url || ""),
        repoCount: profile.public_repos,
        followerCount: profile.followers,
        followingCount: profile.following,
        memberSince: profile.created_at,
        stars: profile.public_repos, // rough
      },
      repos: reposMapped,
    };
  });
}

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Dart: "#0175C2",
  Rust: "#dea584",
  Go: "#00ADD8",
  Kotlin: "#7F52FF",
  Swift: "#F05138",
  Java: "#b07219",
  C: "#555555",
  "C++": "#555555",
  CSharp: "#984077",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Scala: "#c22d40",
  Shell: "#a6a6a6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  React: "#61dafb",
};

function languageColorFor(lang) {
  return LANGUAGE_COLORS[lang] || "#8c8275";
}

function extractLinkedIn(bio, profileUrl) {
  // Try to find a LinkedIn URL in bio or profile links
  const match = bio.match(/linkedin\.com\/in\/[\w-]+\/?/i) ||
    profileUrl.match(/linkedin\.com\/in\/[\w-]+\/?/i);
  return match ? match[0] : null;
}

/** Activity items from the feed (commits, PRs, releases, etc.). */
export function activityFromRepos(repos, limit = 12) {
  const items = [];
  for (const repo of repos.slice(0, limit)) {
    // Each repo contributes one "recent activity" item
    items.push({
      type: "repo-update",
      repoName: repo.name,
      repoUrl: repo.url,
      description: repo.description || `Updated ${new Date(repo.updatedAt).toLocaleDateString()}`,
      language: repo.language,
      languageColor: repo.languageColor,
      starCount: repo.starCount,
      updatedAt: repo.updatedAt,
      fileName: null,
    });
  }
  return items;
}

export { languageColorFor };

const GITHUB_USER = "menoc61";

/** Small cache on `sessionStorage` so refreshes don't re-hit the API. */
const CACHE_KEY = "portfolio-github-cache-v1";
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

async function cachedFetch(key, fetcher) {
  const raw = sessionStorage.getItem(key);
  if (raw) {
    try {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL_MS) return data;
    } catch { /* stale / corrupt → refetch */ }
  }
  const data = await fetcher();
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* storage full — ignore */ }
  return data;
}

async function json(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      ...(window.__GITHUB_TOKEN__ ? { Authorization: `token ${window.__GITHUB_TOKEN__}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

/**
 * Fetch the full profile object. Returns the raw GitHub user object plus a
 * few derived fields the UI uses.
 */
export async function fetchProfile() {
  return cachedFetch(`profile:${GITHUB_USER}`, () =>
    json(`https://api.github.com/users/${GITHUB_USER}`)
      .then((u) => ({
        ...u,
        // Derived — easier for the UI to consume directly.
        avatarUrl: u.avatar_url,
        repoCount: u.public_repos,
        gistCount: u.public_gists,
        followerCount: u.followers,
        followingCount: u.following,
        memberSince: u.created_at,
        updatedAt: u.updated_at,
        blogClean: u.blog || null,
        locationClean: u.location || null,
        bioClean: u.bio || null,
      }))
  );
}

/**
 * Fetch the most recently updated public repos (up to `limit`). Returns a
 * lean subset of fields the repo cards need.
 */
export async function fetchRepos(limit = 12) {
  return cachedFetch(`repos:${GITHUB_USER}`, () =>
    json(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=${limit}&sort=updated&type=all`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    }).then((repos) =>
      repos
        .filter((r) => !r.fork) // drop forks by default; UI can toggle
        .map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          description: r.description || null,
          url: r.html_url,
          homepage: r.homepage || null,
          language: r.language || null,
          primaryLanguage: r.language ? { name: r.language, color: null } : null,
          forkCount: r.forks_count,
          starCount: r.stargazers_count,
          issueCount: r.open_issues_count,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          pushedAt: r.pushed_at,
          isPrivate: r.private,
          isFork: r.fork,
          defaultBranch: r.default_branch,
          topics: r.topics || [],
          licenseName: r.license ? r.license.name : null,
          // Placeholder avatar / preview — real preview would need to
          // fetch from a build artifact or screenshot service.
          previewUrl: null,
        }))
    )
  );
}

/**
 * Fetch a handful of recent activity events so we can surface a small
 * "recent activity" feed on the GitHub section.
 */
export async function fetchRecentActivity(limit = 6) {
  return cachedFetch(`events:${GITHUB_USER}`, () =>
    json(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=${limit}`).then((events) =>
      events
        .filter((e) => e.type === "PushEvent" || e.type === "CreateEvent" || e.type === "IssuesEvent")
        .slice(0, limit)
        .map((e) => ({
          id: e.id,
          type: e.type,
          repo: e.repo.name,
          repoUrl: e.repo.url,
          created: e.created_at,
          payload: e.payload,
        }))
    )
  );
}

/**
 * Build a small "stats card" object used by the GitHub stats widget.
 */
export async function fetchStats() {
  const [profile, repos] = await Promise.all([fetchProfile(), fetchRepos(60)]);
  const totalStars = repos.reduce((s, r) => s + r.starCount, 0);
  const totalForks = repos.reduce((s, r) => s + r.forkCount, 0);
  const languages = new Map();
  repos.forEach((r) => {
    if (r.language) {
      languages.set(r.language, (languages.get(r.language) || 0) + 1);
    }
  });
  return {
    profile,
    repoCount: repos.length,
    totalStars,
    totalForks,
    languages: [...languages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    topRepos: repos.slice(0, 6),
  };
}
