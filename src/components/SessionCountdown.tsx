import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

// Shows mm:ss remaining in a timed session; renders nothing outside one.
export function SessionCountdown({ endsAt }: { endsAt: number | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => setNow(Date.now());
    const firstTick = setTimeout(tick, 0);
    const interval = setInterval(tick, 500);
    return () => {
      clearTimeout(firstTick);
      clearInterval(interval);
    };
  }, [endsAt]);

  if (endsAt === null || now === null) return null;

  const remaining = Math.max(0, endsAt - now);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return (
    <Text style={styles.countdown}>
      {`${minutes}:${String(seconds).padStart(2, '0')}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  countdown: {
    fontVariant: ['tabular-nums'],
    marginRight: 8,
  },
});
