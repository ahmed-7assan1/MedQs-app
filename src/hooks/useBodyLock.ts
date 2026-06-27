import { useEffect } from "react";

let lockCount = 0;

export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (locked) {
      lockCount++;
      if (lockCount === 1) {
        document.body.style.overflow = "hidden";
      }
    }
    return () => {
      if (locked) {
        lockCount--;
        if (lockCount <= 0) {
          lockCount = 0;
          document.body.style.overflow = "";
        }
      }
    };
  }, [locked]);
}
