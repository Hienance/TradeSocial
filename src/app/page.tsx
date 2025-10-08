import { Button } from "@/components/ui/button"

export default function Home() {
  return (
      <div>
        <Button variant={"destructive"}>
          <p className="text-blue-900">
          this is not a button
          </p>
        </Button>
      </div>
  );
}
