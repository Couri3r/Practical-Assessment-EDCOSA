// Home page (/): the request submission screen.
// The page itself is a Server Component; all interactivity is inside NewRequestForm.

import NewRequestForm from "@/components/NewRequestForm";

export default function HomePage() {
  return <NewRequestForm />;
}
