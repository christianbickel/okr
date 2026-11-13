export const CYCLE_VALUES = `
  title
  description { htmlText }
  startDate
  endDate
  cycleType { id value }
  status { id value }
`;

export const OBJECTIVE_VALUES = `
  title
  description { htmlText }
  level { id value }
  cycleId
  status { id value }
  parentObjectiveId
  owner {
    __typename
    ... on User { id displayName email }
    ... on Team { id name }
  }
  teamId
  teamName
  progress
  weight
`;

export const KEY_RESULT_VALUES = `
  title
  description { htmlText }
  objectiveId
  owner {
    __typename
    ... on User { id displayName email }
    ... on Team { id name }
  }
  metricType { id value }
  unit
  status { id value }
  startValue
  targetValue
  currentValue
  weight
  dueDate
`;

export const CHECK_IN_VALUES = `
  title
  keyResultId
  author {
    __typename
    ... on User { id displayName email }
  }
  value
  status { id value }
  checkInDate
  comment
`;
