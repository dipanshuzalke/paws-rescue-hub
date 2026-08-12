export function ok(res, data, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function created(res, data, message = "Created successfully") {
  return ok(res, data, message, 201);
}

export function list(res, data, pagination, message = "OK") {
  return res.status(200).json({ success: true, message, data, pagination });
}

export function buildPagination({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Parses ?page=&limit=&sortBy=&sortOrder= into a safe mongoose query shape. */
export function parseQueryOptions(query, { defaultSort = "createdAt", allowedSort = [] } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const sortField = allowedSort.includes(query.sortBy) ? query.sortBy : defaultSort;
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  return { page, limit, skip: (page - 1) * limit, sort: { [sortField]: sortOrder } };
}
