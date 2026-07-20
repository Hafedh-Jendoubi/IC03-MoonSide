// Lightweight in-memory pub/sub used to tell the navbar (and any other
// interested component) that the current user's connections/requests
// changed, so it can refresh things like the "pending requests" badge.
type Listener = () => void

const listeners = new Set<Listener>()

export function emitConnectionsUpdated() {
  listeners.forEach((listener) => listener())
}

export function subscribeConnectionsUpdated(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
