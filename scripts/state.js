// Centralized application state
export const state = {
  feed: [],
  feedIndex: 0,
  currentQuery: "popular",
  currentPage: 1,
  totalResults: 0,
  isLoading: false,
  cache: new Map(),
  abortController: null,
  watchlist: new Map(),
  genres: [],
  selectedGenre: "",
  selectedYear: "",
  isAutoRotating: false,
  autoRotateInterval: null,
};
