// Placeholder slot for the transit tracker. Task 7 fills it in; with no seasons it renders nothing.
export type TransitTrackerProps = {
  seasons?: readonly unknown[];
};

export default function TransitTracker({ seasons }: TransitTrackerProps) {
  if (!seasons || seasons.length === 0) return null;
  return null; // TODO(lab, task 7): render the seasons.
}
