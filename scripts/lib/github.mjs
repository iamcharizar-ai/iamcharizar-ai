const ENDPOINT = "https://api.github.com/graphql";

const QUERY = `
query ($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    name
    login
    createdAt
    followers { totalCount }
    following { totalCount }
    repositories(privacy: PUBLIC, ownerAffiliations: OWNER, first: 100, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      nodes {
        name
        stargazerCount
        primaryLanguage { name }
      }
    }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
    }
  }
}`;

export async function fetchProfile({ login, token }) {
  if (!token) {
    throw new Error(
      "No GitHub token provided. Set GITHUB_TOKEN (or PROFILE_TOKEN) in the environment."
    );
  }

  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 364);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "profile-art-generator",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login, from: from.toISOString(), to: to.toISOString() },
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API returned ${res.status}: ${await res.text()}`);
  }

  const payload = await res.json();
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${payload.errors.map((e) => e.message).join("; ")}`);
  }
  if (!payload.data?.user) {
    throw new Error(`No such user: ${login}`);
  }

  return payload.data.user;
}

// GitHub reports levels as NONE / FIRST_QUARTILE / ... — map to the 0-4 ramp index.
const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export function toWeeks(user) {
  return user.contributionsCollection.contributionCalendar.weeks.map((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: LEVELS[day.contributionLevel] ?? 0,
    }))
  );
}

// Longest and current run of consecutive days with at least one contribution.
export function streaks(weeks) {
  const days = weeks.flat();
  let longest = 0;
  let run = 0;

  for (const day of days) {
    if (day.count > 0) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  // Today may legitimately be empty mid-day, so an empty final day doesn't break the streak.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      current += 1;
    } else if (i !== days.length - 1) {
      break;
    }
  }

  return { longest, current };
}
