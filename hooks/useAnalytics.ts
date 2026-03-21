import { usePostHog } from 'posthog-react-native';

export function useAnalytics() {
  const posthog = usePostHog();

  return {
    trackSessionStarted: (programName: string) =>
      posthog?.capture('session_started', { program_name: programName }),
    trackSessionCompleted: (duration: number, setCount: number) =>
      posthog?.capture('session_completed', { duration_minutes: Math.round(duration / 60), set_count: setCount }),
    trackPRDetected: (count: number) =>
      posthog?.capture('pr_detected', { pr_count: count }),
    trackPaywallViewed: () =>
      posthog?.capture('paywall_viewed'),
    trackSubscriptionStarted: (plan: string) =>
      posthog?.capture('subscription_started', { plan }),
  };
}
