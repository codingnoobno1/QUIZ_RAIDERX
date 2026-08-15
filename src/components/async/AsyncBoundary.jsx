'use client';

/**
 * The loading / error / empty / data contract.
 *
 * This is `AsyncValue.when(data:, loading:, error:)` from Riverpod, plus the
 * empty branch the Flutter app handles with a dedicated `EmptyState` widget.
 *
 * The point is that all four states are *required by the type of the call* —
 * you cannot forget the empty state, because rendering goes through here.
 *
 *   <AsyncBoundary query={eventsQuery} isEmpty={(d) => d.length === 0}
 *                  empty={<EmptyState … />}>
 *     {(events) => <EventGrid events={events} />}
 *   </AsyncBoundary>
 */

import Loading from './Loading';
import ErrorState from './ErrorState';

export default function AsyncBoundary({
  query,
  children,
  loading,
  loadingLabel = 'Loading',
  error,
  empty = null,
  isEmpty = defaultIsEmpty,
  /** Keep showing data while a background refetch runs (polling). Default on. */
  keepPreviousData = true,
}) {
  const { data, isPending, isError, error: err, refetch, isFetching } = query;

  const hasData = data !== undefined && data !== null;

  if (isPending && !(keepPreviousData && hasData)) {
    return loading ?? <Loading label={loadingLabel} />;
  }

  if (isError && !(keepPreviousData && hasData)) {
    return typeof error === 'function'
      ? error(err, refetch)
      : (error ?? <ErrorState error={err} onRetry={refetch} />);
  }

  if (hasData && isEmpty(data) && empty) return empty;

  return typeof children === 'function' ? children(data, { isFetching, refetch }) : children;
}

function defaultIsEmpty(data) {
  if (Array.isArray(data)) return data.length === 0;
  return false;
}
