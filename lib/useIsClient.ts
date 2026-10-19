import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false khi SSR và ở lần render hydrate đầu tiên, rồi chuyển true — dùng để chỉ render các giá
// trị đọc từ trình duyệt (window/navigator...) sau khi hydrate xong, tránh lệch HTML server/client.
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
